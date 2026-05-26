import { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { BeanRecord } from "../lib/beanStats";
import {
  buildCorrelationMatrix,
  filterBeansByOrigin,
  getNoteCounts,
  getOriginCounts,
  getTotalCoffees,
  getUniqueRoasterCount,
  type HeatmapRowAxis,
  type MatrixCell,
} from "../lib/beanStats";

const CHART_COLORS = [
  "#ffd84d",
  "#f7c6d4",
  "#f08aa3",
  "#ffe066",
  "#f9a8d4",
  "#c9a86c",
  "#e8b4bc",
  "#fff3c4",
];

// ── Extend HeatmapRowAxis to include varietal and process ────────────────────
// NOTE: If your beanStats lib types HeatmapRowAxis as a union, you may need to
// extend it there too. Here we widen it locally so the component compiles.
type ExtendedAxis = HeatmapRowAxis | "varietal" | "process";

const HEATMAP_AXIS_LABELS: Record<ExtendedAxis, string> = {
  roaster: "Roasters",
  notes: "Tasting notes",
  varietal: "Varietals",
  process: "Processes",
};

// ── Panel axis labels for the Roasters & Tasting Notes section ───────────────
type PanelAxis = "notes" | "roaster" | "varietal" | "process";
const PANEL_AXIS_LABELS: Record<PanelAxis, string> = {
  notes: "Tasting notes",
  roaster: "Roasters",
  varietal: "Varietals",
  process: "Processes",
};

interface BeanDashboardProps {
  beans: BeanRecord[];
  loadStatus: "loading" | "ready" | "error";
}

interface HoverOverlayState {
  label: string;
  lookup:
    | { kind: "note"; note: string }
    | { kind: "cell"; row: string; col: string; axis: ExtendedAxis };
  x: number;
  y: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Normalise a comma-containing value to "Mixed", otherwise trim and return as-is.
 * Empty / nullish values become "Unknown".
 */
function normaliseField(value: string | undefined | null): string {
  if (!value || value.trim() === "") return "Unknown";
  return value.includes(",") ? "Mixed" : value.trim();
}

/**
 * Build a correlation matrix that supports varietal and process axes in
 * addition to the existing roaster/notes axes.
 * Falls back to the imported buildCorrelationMatrix for roaster/notes.
 */
function buildExtendedMatrix(
  beans: BeanRecord[],
  axis: ExtendedAxis
): ReturnType<typeof buildCorrelationMatrix> {
  if (axis === "roaster" || axis === "notes") {
    return buildCorrelationMatrix(beans, axis as HeatmapRowAxis);
  }

  // Build matrix for varietal / process
  const colSet = new Set<string>();
  const countMap = new Map<string, Map<string, number>>();

  for (const bean of beans) {
    const rowValue =
      axis === "varietal"
        ? normaliseField((bean as any).varietal)
        : normaliseField((bean as any).process);

    const methods: string[] =
      (bean as any).greatOn ?? (bean as any).greatAs ?? [];

    if (!countMap.has(rowValue)) countMap.set(rowValue, new Map());
    const colMap = countMap.get(rowValue)!;

    for (const method of methods) {
      if (!method) continue;
      colSet.add(method);
      colMap.set(method, (colMap.get(method) ?? 0) + 1);
    }
  }

  const rows = [...countMap.keys()].sort();
  const cols = [...colSet].sort();
  const cells: MatrixCell[] = [];
  let max = 0;

  for (const row of rows) {
    const colMap = countMap.get(row)!;
    for (const col of cols) {
      const count = colMap.get(col) ?? 0;
      if (count > 0) {
        cells.push({ row, col, count });
        if (count > max) max = count;
      }
    }
  }

  return { rows, cols, cells, max: max || 1 };
}

/**
 * Get counts for any panel axis, applying origin filter and Mixed normalisation.
 */
function getPanelCounts(
  beans: BeanRecord[],
  axis: PanelAxis
): { label: string; count: number }[] {
  const map = new Map<string, number>();

  for (const bean of beans) {
    let keys: string[] = [];

    if (axis === "notes") {
      keys = bean.notes ?? [];
    } else if (axis === "roaster") {
      keys = [bean.roaster ?? "Unknown"];
    } else if (axis === "varietal") {
      keys = [normaliseField((bean as any).varietal)];
    } else if (axis === "process") {
      keys = [normaliseField((bean as any).process)];
    }

    for (const key of keys) {
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get overlay beans — extended to handle varietal/process lookups.
 */
function getBeansForOverlay(
  beans: BeanRecord[],
  lookup: HoverOverlayState["lookup"],
  limit = 3
): { roaster: string; name: string; methods: string[] }[] {
  let matched: BeanRecord[];

  if (lookup.kind === "note") {
    matched = beans.filter((b) => b.notes?.includes(lookup.note));
  } else {
    const { row, col, axis } = lookup;
    matched = beans.filter((b) => {
      const methods: string[] =
        (b as any).greatOn ?? (b as any).greatAs ?? [];
      const hasMethod = methods.includes(col);

      if (axis === "roaster") {
        return (b.roaster ?? "Unknown") === row && hasMethod;
      } else if (axis === "notes") {
        return b.notes?.includes(row) && hasMethod;
      } else if (axis === "varietal") {
        return normaliseField((b as any).varietal) === row && hasMethod;
      } else if (axis === "process") {
        return normaliseField((b as any).process) === row && hasMethod;
      }
      return false;
    });
  }

  return matched.slice(0, limit).map((b) => ({
    roaster: b.roaster ?? "Unknown",
    name: (b as any).name ?? (b as any).coffee ?? "",
    methods: (b as any).greatOn ?? (b as any).greatAs ?? [],
  }));
}

// ── Constants ────────────────────────────────────────────────────────────────

const PANEL_COLLAPSED_LIMIT = 5;

export function BeanDashboard({ beans, loadStatus }: BeanDashboardProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [noteOverlay, setNoteOverlay] = useState<HoverOverlayState | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [heatmapAxis, setHeatmapAxis] = useState<ExtendedAxis>("roaster");

  // Panel axis for the Roasters & Tasting Notes card
  const [panelAxis, setPanelAxis] = useState<PanelAxis>("roaster");
  // Track which panel items are expanded (by label)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Whether the main items list itself is expanded
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const filteredBeans = useMemo(
    () => filterBeansByOrigin(beans, selectedOrigin),
    [beans, selectedOrigin]
  );

  const noteCounts = useMemo(() => getNoteCounts(filteredBeans), [filteredBeans]);
  const originCounts = useMemo(() => getOriginCounts(beans), [beans]);

  // Panel counts — respect selectedOrigin filter
  const panelCounts = useMemo(
    () => getPanelCounts(filteredBeans, panelAxis),
    [filteredBeans, panelAxis]
  );

  // For "roaster" axis, also compute a secondary breakdown (notes per roaster)
  // so we can show the expandable note list under each roaster tab.
  const notesByGroupItem = useMemo(() => {
    if (panelAxis !== "roaster") return new Map<string, { label: string; count: number }[]>();
    const map = new Map<string, Map<string, number>>();
    for (const bean of filteredBeans) {
      const roaster = bean.roaster ?? "Unknown";
      if (!map.has(roaster)) map.set(roaster, new Map());
      const noteMap = map.get(roaster)!;
      const greatOnCount =
        (bean as any).greatOn?.length ?? (bean as any).greatAs?.length ?? 1;
      for (const note of bean.notes ?? []) {
        noteMap.set(note, (noteMap.get(note) ?? 0) + greatOnCount);
      }
    }
    const result = new Map<string, { label: string; count: number }[]>();
    for (const [roaster, noteMap] of map) {
      result.set(
        roaster,
        [...noteMap.entries()]
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );
    }
    return result;
  }, [filteredBeans, panelAxis]);

  const heatmapMatrix = useMemo(
    () => buildExtendedMatrix(filteredBeans, heatmapAxis),
    [filteredBeans, heatmapAxis]
  );

  const overlayCoffees = useMemo(() => {
    if (!noteOverlay) return [];
    return getBeansForOverlay(filteredBeans, noteOverlay.lookup, 3);
  }, [filteredBeans, noteOverlay]);

  const maxNoteCount = noteCounts[0]?.count ?? 1;
  const total = getTotalCoffees(beans);
  const roasterCount = getUniqueRoasterCount(beans);

  // Visible panel items (collapsed or expanded)
  const visiblePanelCounts = itemsExpanded
    ? panelCounts
    : panelCounts.slice(0, PANEL_COLLAPSED_LIMIT);

  // Reset expansion state when axis or origin changes
  const handlePanelAxisChange = (axis: PanelAxis) => {
    setPanelAxis(axis);
    setExpandedItems(new Set());
    setItemsExpanded(false);
  };

  const handleOriginSelect = (label: string) => {
    setSelectedOrigin((prev) => (prev === label ? null : label));
    setExpandedItems(new Set());
    setItemsExpanded(false);
  };

  // ── overlay handlers ──────────────────────────────────────────────────────

  const showNoteOverlay = useCallback(
    (note: string, clientX: number, clientY: number) => {
      setNoteOverlay({
        label: note,
        lookup: { kind: "note", note },
        x: clientX,
        y: clientY,
      });
    },
    []
  );

  const moveNoteOverlay = useCallback((clientX: number, clientY: number) => {
    setNoteOverlay((prev) =>
      prev ? { ...prev, x: clientX, y: clientY } : null
    );
  }, []);

  const hideNoteOverlay = useCallback(() => {
    setNoteOverlay(null);
  }, []);

  const showCellOverlay = useCallback(
    (
      row: string,
      col: string,
      axis: ExtendedAxis,
      clientX: number,
      clientY: number
    ) => {
      setNoteOverlay({
        label: `${row} × ${col}`,
        lookup: { kind: "cell", row, col, axis },
        x: clientX,
        y: clientY,
      });
    },
    []
  );

  const moveCellOverlay = useCallback((clientX: number, clientY: number) => {
    setNoteOverlay((prev) =>
      prev ? { ...prev, x: clientX, y: clientY } : null
    );
  }, []);

  const hideCellOverlay = useCallback(() => {
    setNoteOverlay(null);
  }, []);

  // ── render guards ─────────────────────────────────────────────────────────

  if (loadStatus === "loading") {
    return (
      <div className="bean-dashboard bean-dashboard--loading">
        <p className="load-status">Brewing that sweet, sweet data…</p>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div className="bean-dashboard bean-dashboard--empty">
        <p>Dashboard visuals need data from the database first.</p>
      </div>
    );
  }

  if (beans.length === 0) {
    return (
      <div className="bean-dashboard bean-dashboard--empty">
        <p>
          No coffees tracked yet. Add your first bag and the charts will fill in.
        </p>
      </div>
    );
  }

  // ── main render ───────────────────────────────────────────────────────────

  return (
    <div className="bean-dashboard">
      <div className="dashboard-grid">

        {/* ── 1. Collection stat ── */}
        <article
          className={`dashboard-card dashboard-card--stat${activePanel === "total" ? " is-active" : ""}`}
          onMouseEnter={() => setActivePanel("total")}
          onMouseLeave={() => setActivePanel(null)}
        >
          <span className="dashboard-card__eyebrow">Collection</span>
          <p className="dashboard-stat" aria-live="polite">
            <span className="dashboard-stat__value">{total}</span>
            <span className="dashboard-stat__unit">
              {total === 1 ? "coffee" : "coffees"}
            </span>
          </p>
          <p className="dashboard-card__meta dashboard-card__meta--compact">
            <strong>{roasterCount}</strong>{" "}
            {roasterCount === 1 ? "roaster" : "roasters"}
          </p>
        </article>

        {/* ── 2. Origins ── */}
        <div className="dashboard-row dashboard-row--origins">
          <article
            className={`dashboard-card dashboard-card--origins${activePanel === "origins" ? " is-active" : ""}`}
            onMouseEnter={() => setActivePanel("origins")}
            onMouseLeave={() => setActivePanel(null)}
          >
            <header className="dashboard-card__header">
              <div>
                <h3 className="dashboard-card__title">Origins</h3>
                <p className="dashboard-card__subtitle">Click on a country to filter the data.</p>
              </div>
            </header>
            <DonutChart
              entries={originCounts}
              selected={selectedOrigin}
              onSelect={handleOriginSelect}
            />
            <ul className="donut-legend">
              {originCounts.map((entry, i) => (
                <li key={entry.label}>
                  <button
                    type="button"
                    className={`donut-legend__btn${
                      selectedOrigin === entry.label ? " is-selected" : ""
                    }`}
                    onClick={() => handleOriginSelect(entry.label)}
                  >
                    <span
                      className="donut-legend__swatch"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span>{entry.label}</span>
                    <span className="donut-legend__count">{entry.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>

          {/* ── 3. Roasters & Tasting Notes (now with axis switcher + collapse) ── */}
          <article
            className={`dashboard-card dashboard-card--origin-notes${activePanel === "roaster-notes" ? " is-active" : ""}`}
            onMouseEnter={() => setActivePanel("roaster-notes")}
            onMouseLeave={() => setActivePanel(null)}
          >
            <header className="dashboard-card__header">
              <div>
                <h3 className="dashboard-card__title dashboard-card__title--heatmap">
                  {/* Axis selector mirroring the heatmap style */}
                  <label className="heatmap-axis-label">
                    <span className="visually-hidden">Show: </span>
                    <select
                      className="heatmap-axis-select"
                      value={panelAxis}
                      onChange={(e) =>
                        handlePanelAxisChange(e.target.value as PanelAxis)
                      }
                      aria-label="Panel grouping"
                    >
                      <option value="roaster">Roasters</option>
                      <option value="notes">Tasting notes</option>
                      <option value="varietal">Varietals</option>
                      <option value="process">Processes</option>
                    </select>
                  </label>
                </h3>
                <p className="dashboard-card__subtitle">
                  {selectedOrigin
                    ? `Filtered by ${selectedOrigin} · `
                    : ""}
                  {panelAxis === "roaster"
                    ? "Sorted by number of coffees. Expand a roaster to see its tasting notes."
                    : `All ${PANEL_AXIS_LABELS[panelAxis].toLowerCase()} sorted by count.`}
                </p>
              </div>
            </header>

            {/* Item list */}
            <div className="panel-axis-list">
              {visiblePanelCounts.length === 0 ? (
                <p className="dashboard-card__meta">No data yet.</p>
              ) : (
                visiblePanelCounts.map((item, i) => {
                  const isExpanded = expandedItems.has(item.label);
                  const subNotes =
                    panelAxis === "roaster"
                      ? notesByGroupItem.get(item.label) ?? []
                      : [];
                  const visibleSubNotes = isExpanded
                    ? subNotes
                    : subNotes.slice(0, PANEL_COLLAPSED_LIMIT);

                  return (
                    <div key={item.label} className="panel-axis-item">
                      <div className="panel-axis-item__header">
                        <span
                          className="panel-axis-item__swatch"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="panel-axis-item__label">{item.label}</span>
                        <span className="panel-axis-item__count">{item.count}</span>
                        {/* Expand button — only for roasters (sub-notes exist) */}
                        {panelAxis === "roaster" && subNotes.length > 0 && (
                          <button
                            type="button"
                            className="panel-axis-item__expand-btn"
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpandedItems((prev) => {
                                const next = new Set(prev);
                                isExpanded
                                  ? next.delete(item.label)
                                  : next.add(item.label);
                                return next;
                              })
                            }
                          >
                            {isExpanded ? "▲ Hide notes" : "▼ Show notes"}
                          </button>
                        )}
                      </div>

                      {/* Sub-notes for roaster axis */}
                      {panelAxis === "roaster" && isExpanded && (
                        <div className="panel-axis-item__subnotes">
                          <div className="note-cloud note-cloud--sub">
                            {visibleSubNotes.map((note, j) => {
                              const scale =
                                0.7 +
                                (note.count / (subNotes[0]?.count ?? 1)) * 0.45;
                              return (
                                <span
                                  key={note.label}
                                  className="note-cloud__tag note-cloud__tag--small"
                                  style={{
                                    fontSize: `${scale}rem`,
                                    background:
                                      CHART_COLORS[j % CHART_COLORS.length],
                                  }}
                                >
                                  {note.label}
                                  <span className="note-cloud__count">
                                    {note.count}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                          {subNotes.length > PANEL_COLLAPSED_LIMIT && (
                            <button
                              type="button"
                              className="panel-axis-item__expand-btn panel-axis-item__expand-btn--sub"
                              onClick={() =>
                                setExpandedItems((prev) => {
                                  // We reuse the same expanded state but track
                                  // sub-expansion via a secondary key
                                  const subKey = `${item.label}::subnotes`;
                                  const next = new Set(prev);
                                  next.has(subKey)
                                    ? next.delete(subKey)
                                    : next.add(subKey);
                                  // Always keep parent expanded
                                  next.add(item.label);
                                  return next;
                                })
                              }
                            >
                              {expandedItems.has(`${item.label}::subnotes`)
                                ? `▲ Show fewer notes`
                                : `▼ Show all ${subNotes.length} notes`}
                            </button>
                          )}
                          {/* Re-render with full sub-notes if sub-expanded */}
                          {expandedItems.has(`${item.label}::subnotes`) &&
                            subNotes.length > PANEL_COLLAPSED_LIMIT && (
                              <div className="note-cloud note-cloud--sub">
                                {subNotes
                                  .slice(PANEL_COLLAPSED_LIMIT)
                                  .map((note, j) => {
                                    const scale =
                                      0.7 +
                                      (note.count / (subNotes[0]?.count ?? 1)) *
                                        0.45;
                                    return (
                                      <span
                                        key={note.label}
                                        className="note-cloud__tag note-cloud__tag--small"
                                        style={{
                                          fontSize: `${scale}rem`,
                                          background:
                                            CHART_COLORS[
                                              (j + PANEL_COLLAPSED_LIMIT) %
                                                CHART_COLORS.length
                                            ],
                                        }}
                                      >
                                        {note.label}
                                        <span className="note-cloud__count">
                                          {note.count}
                                        </span>
                                      </span>
                                    );
                                  })}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Show more / show fewer for the top-level list */}
              {panelCounts.length > PANEL_COLLAPSED_LIMIT && (
                <button
                  type="button"
                  className="panel-axis-showmore"
                  onClick={() => setItemsExpanded((v) => !v)}
                >
                  {itemsExpanded
                    ? `▲ Show fewer`
                    : `▼ Show all ${panelCounts.length} ${PANEL_AXIS_LABELS[panelAxis].toLowerCase()}`}
                </button>
              )}
            </div>
          </article>
        </div>

        {/* ── 4. Tasting Notes bar chart ── */}
        <article
          className={`dashboard-card dashboard-card--notes${activePanel === "notes" ? " is-active" : ""}`}
          onMouseEnter={() => setActivePanel("notes")}
          onMouseLeave={() => setActivePanel(null)}
        >
          <header className="dashboard-card__header">
            <div>
              <h3 className="dashboard-card__title">Tasting notes</h3>
              <p className="dashboard-card__subtitle">Most common flavours</p>
              {selectedOrigin && (
                <p className="dashboard-filter-hint">
                  Filtered by <em>{selectedOrigin}</em> —{" "}
                  <button
                    type="button"
                    className="dashboard-link-btn"
                    onClick={() => setSelectedOrigin(null)}
                  >
                    clear
                  </button>
                </p>
              )}
            </div>
          </header>
          <ul className="bar-chart" role="list">
            {noteCounts.slice(0, 10).map((entry, i) => {
              const pct = (entry.count / maxNoteCount) * 100;
              const isHovered = noteOverlay?.label === entry.label;
              return (
                <li
                  key={entry.label}
                  className="bar-chart__row"
                  onMouseMove={(e) => {
                    if (isHovered) moveNoteOverlay(e.clientX, e.clientY);
                  }}
                >
                  <button
                    type="button"
                    className={`bar-chart__label${isHovered ? " is-highlight" : ""}`}
                    onMouseEnter={(e) =>
                      showNoteOverlay(entry.label, e.clientX, e.clientY)
                    }
                    onMouseMove={(e) =>
                      showNoteOverlay(entry.label, e.clientX, e.clientY)
                    }
                    onMouseLeave={hideNoteOverlay}
                    onFocus={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      showNoteOverlay(
                        entry.label,
                        rect.right,
                        rect.top + rect.height / 2
                      );
                    }}
                    onBlur={hideNoteOverlay}
                  >
                    {entry.label}
                  </button>
                  <div className="bar-chart__track" aria-hidden>
                    <span
                      className="bar-chart__fill"
                      style={{
                        width: `${pct}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                        opacity: isHovered || !noteOverlay ? 1 : 0.35,
                      }}
                    />
                  </div>
                  <span className="bar-chart__count">{entry.count}</span>
                </li>
              );
            })}
          </ul>
        </article>

        {/* ── 5. Heatmap (now with varietal + process axes) ── */}
        <article
          className={`dashboard-card dashboard-card--matrix${activePanel === "heatmap" ? " is-active" : ""}`}
          onMouseEnter={() => setActivePanel("heatmap")}
          onMouseLeave={() => setActivePanel(null)}
        >
          <header className="dashboard-card__header">
            <div>
              <h3 className="dashboard-card__title dashboard-card__title--heatmap">
                <label className="heatmap-axis-label">
                  <span className="visually-hidden">Y-axis: </span>
                  <select
                    className="heatmap-axis-select"
                    value={heatmapAxis}
                    onChange={(e) =>
                      setHeatmapAxis(e.target.value as ExtendedAxis)
                    }
                    aria-label="Heatmap row axis"
                  >
                    <option value="roaster">Roasters</option>
                    <option value="notes">Tasting notes</option>
                    <option value="varietal">Varietals</option>
                    <option value="process">Processes</option>
                  </select>
                </label>
                <span className="heatmap-axis-suffix"> &amp; brew methods</span>
              </h3>
              <p className="dashboard-card__subtitle">
                How {HEATMAP_AXIS_LABELS[heatmapAxis].toLowerCase()} pair with brew methods
              </p>
            </div>
          </header>
          <Heatmap
            matrix={heatmapMatrix}
            rowLabel={
              heatmapAxis === "roaster"
                ? "Roaster"
                : heatmapAxis === "notes"
                ? "Note"
                : heatmapAxis === "varietal"
                ? "Varietal"
                : "Process"
            }
            axis={heatmapAxis}
            onCellOverlay={(row, col, x, y) =>
              showCellOverlay(row, col, heatmapAxis, x, y)
            }
            onCellOverlayMove={moveCellOverlay}
            onCellOverlayHide={hideCellOverlay}
          />
        </article>
      </div>

      {/* ── Hover overlay portal ── */}
      {noteOverlay &&
        createPortal(
          <NoteCoffeeOverlay
            label={noteOverlay.label}
            x={noteOverlay.x}
            y={noteOverlay.y}
            coffees={overlayCoffees}
          />,
          document.body
        )}
    </div>
  );
}

// ── NoteCoffeeOverlay ────────────────────────────────────────────────────────

interface NoteCoffeeOverlayProps {
  label: string;
  x: number;
  y: number;
  coffees: { roaster: string; name: string; methods: string[] }[];
}

function NoteCoffeeOverlay({ label, x, y, coffees }: NoteCoffeeOverlayProps) {
  const isRightHalf = x > window.innerWidth / 2;
  return (
    <div
      className="note-coffee-overlay"
      style={{
        top: y,
        left: x,
        transform: isRightHalf ? "translate(-100%, 0)" : "none",
      }}
      role="tooltip"
    >
      <p className="note-coffee-overlay__title">{label}</p>
      {coffees.length === 0 ? (
        <p className="note-coffee-overlay__empty">No coffees with this note</p>
      ) : (
        <ul className="note-coffee-overlay__list">
          {coffees.map((coffee) => (
            <li key={`${coffee.roaster}-${coffee.name}`}>
              <span className="note-coffee-overlay__name">
                {coffee.roaster} · {coffee.name}
              </span>
              {coffee.methods.length > 0 ? (
                <span className="note-coffee-overlay__methods">
                  {coffee.methods.join(", ")}
                </span>
              ) : (
                <span className="note-coffee-overlay__methods note-coffee-overlay__methods--none">
                  No brew methods yet
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── DonutChart ───────────────────────────────────────────────────────────────

interface DonutChartProps {
  entries: { label: string; count: number }[];
  selected: string | null;
  onSelect: (label: string) => void;
}

function DonutChart({ entries, selected, onSelect }: DonutChartProps) {
  const total = entries.reduce((s, e) => s + e.count, 0) || 1;
  const size = 140;
  const stroke = 24;
  const selectedStroke = 32;
  const pad = (selectedStroke - stroke) / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2 + pad;
  const cy = size / 2 + pad;
  const vbSize = size + pad * 2;
  let offset = 0;

  return (
    <svg
      className="donut-chart donut-chart--compact"
      viewBox={`0 0 ${vbSize} ${vbSize}`}
      role="img"
      aria-label="Coffees by country of origin"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--cream-mid)"
        strokeWidth={stroke}
      />
      {entries.map((entry, i) => {
        const fraction = entry.count / total;
        const dash = fraction * circumference;
        const isSelected = selected === entry.label;
        const segment = (
          <circle
            key={entry.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={isSelected ? selectedStroke : stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className={`donut-segment${
              selected && !isSelected ? " is-dimmed" : ""
            }${isSelected ? " is-selected" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(entry.label)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(entry.label);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${entry.label}: ${entry.count}`}
          />
        );
        offset += dash;
        return segment;
      })}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="donut-chart__center"
      >
        {total}
      </text>
    </svg>
  );
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

interface HeatmapProps {
  matrix: ReturnType<typeof buildCorrelationMatrix>;
  rowLabel: string;
  axis: ExtendedAxis;
  onCellOverlay: (row: string, col: string, x: number, y: number) => void;
  onCellOverlayMove: (x: number, y: number) => void;
  onCellOverlayHide: () => void;
}

function Heatmap({
  matrix,
  rowLabel,
  axis: _axis,
  onCellOverlay,
  onCellOverlayMove,
  onCellOverlayHide,
}: HeatmapProps) {
  const [hovered, setHovered] = useState<MatrixCell | null>(null);
  const { rows, cols, cells, max } = matrix;

  if (rows.length === 0 || cols.length === 0) {
    return <p className="dashboard-card__meta">Not enough data yet.</p>;
  }

  const cellMap = new Map(cells.map((c) => [`${c.row}::${c.col}`, c.count]));

  const ROW_HEADER_W = "minmax(6rem, max-content)";
  const COL_W = "minmax(2.5rem, 1fr)";
  const gridTemplateColumns = [ROW_HEADER_W, ...cols.map(() => COL_W)].join(" ");

  return (
    <div className="heatmap-wrap">
      <div
        className="heatmap-grid"
        style={{ gridTemplateColumns }}
        role="table"
        aria-label="Brew-method heatmap"
      >
        {/* Header row */}
        <div className="heatmap__corner" role="columnheader">
          {rowLabel} / Method
        </div>
        {cols.map((col) => (
          <div key={col} className="heatmap__col-head" role="columnheader">
            {col}
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <>
            <div key={`${row}--head`} className="heatmap__row-head" role="rowheader">
              {row}
            </div>
            {cols.map((col) => {
              const count = cellMap.get(`${row}::${col}`) ?? 0;
              const intensity = count / max;
              const isHot = hovered?.row === row && hovered?.col === col;

              return (
                <div
                  key={`${row}::${col}`}
                  role="cell"
                  className={`heatmap__cell${count ? "" : " is-empty"}${isHot ? " is-hot" : ""}`}
                  style={{
                    background:
                      count > 0
                        ? `color-mix(in srgb, var(--yellow) ${Math.round(
                            20 + intensity * 70
                          )}%, var(--pink-soft))`
                        : undefined,
                    cursor: count ? "pointer" : "default",
                  }}
                  aria-label={
                    count
                      ? `${row}, ${col}: ${count}`
                      : `${row}, ${col}: no data`
                  }
                  onMouseEnter={(e) => {
                    if (!count) return;
                    setHovered({ row, col, count });
                    onCellOverlay(row, col, e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => {
                    if (!count) return;
                    onCellOverlayMove(e.clientX, e.clientY);
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                    onCellOverlayHide();
                  }}
                  onFocus={(e) => {
                    if (!count) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHovered({ row, col, count });
                    onCellOverlay(row, col, rect.right, rect.top);
                  }}
                  onBlur={() => {
                    setHovered(null);
                    onCellOverlayHide();
                  }}
                  tabIndex={count ? 0 : -1}
                >
                  {count || ""}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}