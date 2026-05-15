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

const HEATMAP_AXIS_LABELS: Record<HeatmapRowAxis, string> = {
  roaster: "Roasters",
  notes: "Tasting notes",
};

interface BeanDashboardProps {
  beans: BeanRecord[];
  loadStatus: "loading" | "ready" | "error";
}

interface HoverOverlayState {
  /** Human-readable title shown in the card, e.g. "Onyx × Espresso" or "Caramel" */
  label: string;
  /**
   * Structured lookup context so we can always find the right beans:
   * - kind "note"  → filter beans by note label
   * - kind "cell"  → filter beans by heatmap row+col given the current axis
   */
  lookup:
    | { kind: "note"; note: string }
    | { kind: "cell"; row: string; col: string; axis: HeatmapRowAxis };
  x: number;
  y: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Group tasting notes by roaster, counting only "Great On" brew-method entries
 * (i.e. bean.greatOn / bean.greatAs entries) rather than raw note occurrences.
 * Falls back to plain note counts if the bean model doesn't carry greatOn data.
 */
function getNotesByRoaster(
  beans: BeanRecord[]
): Map<string, { label: string; count: number }[]> {
  const roasterNotes = new Map<string, Map<string, number>>();

  for (const bean of beans) {
    const roaster = bean.roaster ?? "Unknown";
    if (!roasterNotes.has(roaster)) roasterNotes.set(roaster, new Map());
    const noteMap = roasterNotes.get(roaster)!;
    // Weight by greatOn entries so popular/loved notes surface first.
    const greatOnCount =
      (bean as any).greatOn?.length ?? (bean as any).greatAs?.length ?? 1;
    for (const note of bean.notes ?? []) {
      noteMap.set(note, (noteMap.get(note) ?? 0) + greatOnCount);
    }
  }

  const result = new Map<string, { label: string; count: number }[]>();
  for (const [roaster, noteMap] of roasterNotes) {
    const sorted = [...noteMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    result.set(roaster, sorted);
  }
  return result;
}

/**
 * Aggregate tasting notes across ALL beans weighted by "Great On" entries,
 * returning them sorted descending — used as the default view before a roaster
 * is selected.
 */
function getTopNotesWeightedByGreatOn(
  beans: BeanRecord[]
): { label: string; count: number }[] {
  const noteMap = new Map<string, number>();
  for (const bean of beans) {
    const greatOnCount =
      (bean as any).greatOn?.length ?? (bean as any).greatAs?.length ?? 1;
    for (const note of bean.notes ?? []) {
      noteMap.set(note, (noteMap.get(note) ?? 0) + greatOnCount);
    }
  }
  return [...noteMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Given a HoverOverlayState lookup descriptor and the current bean list,
 * returns up to `limit` matching BeanRecords (with their brew methods attached)
 * for display in the overlay card.
 *
 * For "note" lookups:  beans that have that note in their notes array.
 * For "cell" lookups:
 *   - axis "roaster": beans whose roaster === row AND whose greatAs/greatOn
 *     brew methods include col.
 *   - axis "notes":   beans whose notes include row AND whose greatAs/greatOn
 *     brew methods include col.
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
      } else {
        // axis === "notes"
        return b.notes?.includes(row) && hasMethod;
      }
    });
  }

  return matched.slice(0, limit).map((b) => ({
    roaster: b.roaster ?? "Unknown",
    name: (b as any).name ?? (b as any).coffee ?? "",
    methods: (b as any).greatOn ?? (b as any).greatAs ?? [],
  }));
}

export function BeanDashboard({ beans, loadStatus }: BeanDashboardProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [noteOverlay, setNoteOverlay] = useState<HoverOverlayState | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [heatmapAxis, setHeatmapAxis] = useState<HeatmapRowAxis>("roaster");

  // selectedRoaster drives the Roasters & Tasting Notes panel independently
  const [selectedRoaster, setSelectedRoaster] = useState<string | null>(null);

  const filteredBeans = useMemo(
    () => filterBeansByOrigin(beans, selectedOrigin),
    [beans, selectedOrigin]
  );

  const noteCounts = useMemo(() => getNoteCounts(filteredBeans), [filteredBeans]);
  const originCounts = useMemo(() => getOriginCounts(beans), [beans]);
  const notesByRoaster = useMemo(() => getNotesByRoaster(beans), [beans]);
  const topNotesWeighted = useMemo(() => getTopNotesWeightedByGreatOn(beans), [beans]);
  const heatmapMatrix = useMemo(
    () => buildCorrelationMatrix(filteredBeans, heatmapAxis),
    [filteredBeans, heatmapAxis]
  );

  const overlayCoffees = useMemo(() => {
    if (!noteOverlay) return [];
    return getBeansForOverlay(filteredBeans, noteOverlay.lookup, 3);
  }, [filteredBeans, noteOverlay]);

  const maxNoteCount = noteCounts[0]?.count ?? 1;
  const total = getTotalCoffees(beans);
  const roasterCount = getUniqueRoasterCount(beans);
  const roasterEntries = [...notesByRoaster.entries()];

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
      axis: HeatmapRowAxis,
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

        {/* ── 2. Origins (moved before Tasting Notes) ── */}
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
              onSelect={(label) =>
                setSelectedOrigin((prev) => (prev === label ? null : label))
              }
            />
            <ul className="donut-legend">
              {originCounts.map((entry, i) => (
                <li key={entry.label}>
                  <button
                    type="button"
                    className={`donut-legend__btn${
                      selectedOrigin === entry.label ? " is-selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedOrigin((prev) =>
                        prev === entry.label ? null : entry.label
                      )
                    }
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

          {/* ── 3. Roasters & Tasting Notes ── */}
          <article
            className={`dashboard-card dashboard-card--origin-notes${activePanel === "roaster-notes" ? " is-active" : ""}`}
            onMouseEnter={() => setActivePanel("roaster-notes")}
            onMouseLeave={() => setActivePanel(null)}
          >
            <header className="dashboard-card__header">
              <div>
                <h3 className="dashboard-card__title">
                  Roasters &amp; tasting notes
                </h3>
                <p className="dashboard-card__subtitle">
                  {selectedRoaster
                    ? `Most liked flavours for ${selectedRoaster}`
                    : "Most liked tasting notes across all roasters. Each 'Great as' gets one point."}
                </p>
              </div>
            </header>
            <div className="origin-notes">
              <div className="origin-notes__tabs" role="tablist">
                {/* "All" pill resets to the default weighted view */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedRoaster === null}
                  className={`origin-tab${selectedRoaster === null ? " is-selected" : ""}`}
                  onClick={() => setSelectedRoaster(null)}
                >
                  All
                </button>
                {roasterEntries.map(([roaster]) => (
                  <button
                    key={roaster}
                    type="button"
                    role="tab"
                    aria-selected={selectedRoaster === roaster}
                    className={`origin-tab${
                      selectedRoaster === roaster ? " is-selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedRoaster((prev) =>
                        prev === roaster ? null : roaster
                      )
                    }
                  >
                    {roaster}
                  </button>
                ))}
              </div>
              <div className="origin-notes__panel">
                {(() => {
                  // When no roaster is selected, show the global "most liked" cloud.
                  const activeNotes = selectedRoaster
                    ? (notesByRoaster.get(selectedRoaster) ?? [])
                    : topNotesWeighted;
                  const panelTitle = selectedRoaster ?? "Most liked";
                  return (
                    <div className="origin-notes__detail">
                      <h4>{panelTitle}</h4>
                      <div className="note-cloud">
                        {activeNotes.length === 0 ? (
                          <p className="dashboard-card__meta">No notes yet</p>
                        ) : (
                          activeNotes.map((note, i) => {
                            const scale =
                              0.75 +
                              (note.count / (activeNotes[0]?.count ?? 1)) * 0.5;
                            const isHovered = noteOverlay?.label === note.label;
                            return (
                              <span
                                key={note.label}
                                className="note-cloud__tag"
                                style={{
                                  fontSize: `${scale}rem`,
                                  background:
                                    CHART_COLORS[i % CHART_COLORS.length],
                                  cursor: "default",
                                  opacity: isHovered || !noteOverlay ? 1 : 0.5,
                                }}
                                onMouseEnter={(e) =>
                                  showNoteOverlay(note.label, e.clientX, e.clientY)
                                }
                                onMouseMove={(e) =>
                                  moveNoteOverlay(e.clientX, e.clientY)
                                }
                                onMouseLeave={hideNoteOverlay}
                              >
                                {note.label}
                                <span className="note-cloud__count">
                                  {note.count}
                                </span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </article>
        </div>

        {/* ── 4. Tasting Notes bar chart (moved after Origins) ── */}
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

        {/* ── 5. Heatmap ── */}
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
                      setHeatmapAxis(e.target.value as HeatmapRowAxis)
                    }
                    aria-label="Heatmap row axis"
                  >
                    <option value="roaster">Roasters</option>
                    <option value="notes">Tasting notes</option>
                  </select>
                </label>
                <span className="heatmap-axis-suffix"> &amp; brew methods</span>
              </h3>
              <p className="dashboard-card__subtitle">
                How {HEATMAP_AXIS_LABELS[heatmapAxis].toLowerCase()} pair with
                &ldquo;Great As&rdquo;
              </p>
            </div>
          </header>
          <Heatmap
            matrix={heatmapMatrix}
            rowLabel={heatmapAxis === "roaster" ? "Roaster" : "Note"}
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
        // Left half: no transform — top-left corner at pointer, grows right.
        // Right half: shift fully left — top-right corner at pointer, grows left.
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
  // Padding must be at least half the extra stroke so the expanded segment
  // isn't clipped by the SVG viewport. Half of (selectedStroke - stroke) = 4.
  const pad = (selectedStroke - stroke) / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // The viewBox is enlarged by `pad` on every side; circles stay centred on
  // (size/2 + pad, size/2 + pad) within the padded coordinate space.
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
  axis: HeatmapRowAxis;
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

  // Dynamic column widths: row-header + one equal fraction per data column.
  // We use a CSS grid laid out as a flat sequence of divs instead of a table
  // so we can collapse all gaps to zero and size cells purely by content.
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