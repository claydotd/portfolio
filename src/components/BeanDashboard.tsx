import { useMemo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { BeanRecord } from "../lib/beanStats";
import {
  buildCategoryCorrelationMatrix,
  buildCorrelationMatrix,
  beanHasCategory,
  filterBeansByOrigin,
  filterEntriesByMinSample,
  filterMapByMinSample,
  getCategoriesByGroup,
  getCategoryBarsByGroup,
  getCategoryCountsWeightedByGreatOn,
  getBeanGroupKey,
  getGroupCoffeeCounts,
  getNoteCategoryCounts,
  getNoteCategoryCoffeeCounts,
  getNoteCoffeeCounts,
  getNoteCounts,
  getOriginCounts,
  getTotalCoffees,
  getUniqueRoasterCount,
  normaliseBeanField,
  type GroupAxis,
  type GroupCategoryBars,
  type HeatmapRowAxis,
  type MatrixCell,
  type NoteCategory,
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

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  Fruity: "#ffd84d",
  Nutty: "#c9a86c",
  Sweet: "#f7c6d4",
  Floral: "#f9a8d4",
  Spicy: "#f08aa3",
  Earthy: "#8b7355",
};

const MIN_SAMPLE_OPTIONS = [1, 2, 3, 4, 5] as const;

const GROUP_AXIS_LABELS: Record<GroupAxis, string> = {
  roaster: "Roasters",
  varietal: "Varietals",
  process: "Processes",
  origin: "Origins",
};

// ── Extended axis type (adds varietal + process to the heatmap) ──────────────
type ExtendedAxis = HeatmapRowAxis | "varietal" | "process";

const HEATMAP_AXIS_LABELS: Record<ExtendedAxis, string> = {
  roaster: "Roasters",
  notes: "Tasting notes",
  varietal: "Varietals",
  process: "Processes",
};

// ── Panel tab axis — what the tabs in the Roasters & Tasting Notes card show ─
type PanelTabAxis = "roaster" | "varietal" | "process";

interface BeanDashboardProps {
  beans: BeanRecord[];
  loadStatus: "loading" | "ready" | "error";
}

interface HoverOverlayState {
  label: string;
  lookup:
    | { kind: "note"; note: string }
    | { kind: "category"; category: NoteCategory }
    | { kind: "groupCategory"; group: string; category: NoteCategory; axis: GroupAxis }
    | { kind: "cell"; row: string; col: string; axis: ExtendedAxis };
  x: number;
  y: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Normalise comma-containing values to "Mixed"; empty → "Unknown". */
function normaliseField(value: string | undefined | null): string {
  return normaliseBeanField(value);
}

function getRowCoffeeCount(
  beans: BeanRecord[],
  axis: ExtendedAxis,
  row: string,
  aggregateNotes: boolean
): number {
  return beans.filter((bean) => {
    if (axis === "roaster") return (bean.roaster ?? "Unknown") === row;
    if (axis === "notes") {
      if (aggregateNotes) return beanHasCategory(bean, row as NoteCategory);
      return bean.notes?.includes(row) ?? false;
    }
    if (axis === "varietal") return normaliseField((bean as any).varietal) === row;
    if (axis === "process") return normaliseField((bean as any).process) === row;
    return false;
  }).length;
}

function filterMatrixByMinSample(
  matrix: ReturnType<typeof buildCorrelationMatrix>,
  beans: BeanRecord[],
  axis: ExtendedAxis,
  aggregateNotes: boolean,
  minSample: number
): ReturnType<typeof buildCorrelationMatrix> {
  if (minSample <= 1) return matrix;

  const filteredRows = matrix.rows.filter(
    (row) => getRowCoffeeCount(beans, axis, row, aggregateNotes) >= minSample
  );
  const rowSet = new Set(filteredRows);
  const cells = matrix.cells.filter((cell) => rowSet.has(cell.row));
  const max = cells.reduce((current, cell) => Math.max(current, cell.count), 0);

  return {
    rows: filteredRows,
    cols: matrix.cols,
    cells,
    max: max || 1,
  };
}

function filterNoteEntriesByMinSample(
  entries: { label: string; count: number }[],
  coffeeCounts: { label: string; count: number }[],
  minSample: number
): { label: string; count: number }[] {
  if (minSample <= 1) return entries;
  const coffeeCountMap = new Map(coffeeCounts.map((entry) => [entry.label, entry.count]));
  return entries.filter((entry) => (coffeeCountMap.get(entry.label) ?? 0) >= minSample);
}

/**
 * Build a heatmap correlation matrix that supports varietal and process axes
 * in addition to the existing roaster/notes axes from beanStats.
 */
function buildExtendedMatrix(
  beans: BeanRecord[],
  axis: ExtendedAxis,
  aggregateNotes: boolean
): ReturnType<typeof buildCorrelationMatrix> {
  if (axis === "notes") {
    return aggregateNotes
      ? buildCategoryCorrelationMatrix(beans)
      : buildCorrelationMatrix(beans, "notes");
  }

  if (axis === "roaster") {
    return buildCorrelationMatrix(beans, axis as HeatmapRowAxis);
  }

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

function getNotesByGroup(
  beans: BeanRecord[],
  axis: PanelTabAxis
): Map<string, { label: string; count: number }[]> {
  const groupNotes = new Map<string, Map<string, number>>();

  for (const bean of beans) {
    const groupKey =
      axis === "roaster"
        ? (bean.roaster ?? "Unknown")
        : axis === "varietal"
        ? normaliseField((bean as any).varietal)
        : normaliseField((bean as any).process);

    if (!groupNotes.has(groupKey)) groupNotes.set(groupKey, new Map());
    const noteMap = groupNotes.get(groupKey)!;
    const greatOnCount =
      (bean as any).greatOn?.length ?? (bean as any).greatAs?.length ?? 1;
    for (const note of bean.notes ?? []) {
      noteMap.set(note, (noteMap.get(note) ?? 0) + greatOnCount);
    }
  }

  const groupCoffeeCount = new Map<string, number>();
  for (const bean of beans) {
    const groupKey =
      axis === "roaster"
        ? (bean.roaster ?? "Unknown")
        : axis === "varietal"
        ? normaliseField((bean as any).varietal)
        : normaliseField((bean as any).process);
    groupCoffeeCount.set(groupKey, (groupCoffeeCount.get(groupKey) ?? 0) + 1);
  }

  const result = new Map<string, { label: string; count: number }[]>();
  const sortedEntries = [...groupNotes.entries()].sort(
    (a, b) => (groupCoffeeCount.get(b[0]) ?? 0) - (groupCoffeeCount.get(a[0]) ?? 0)
  );
  for (const [groupKey, noteMap] of sortedEntries) {
    const sorted = [...noteMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    result.set(groupKey, sorted);
  }
  return result;
}

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

function getBeansForOverlay(
  beans: BeanRecord[],
  lookup: HoverOverlayState["lookup"],
  aggregateNotes: boolean,
  limit = 3
): { roaster: string; name: string; methods: string[] }[] {
  let matched: BeanRecord[];

  if (lookup.kind === "note") {
    matched = beans.filter((b) => b.notes?.includes(lookup.note));
  } else if (lookup.kind === "category") {
    matched = beans.filter((b) => beanHasCategory(b, lookup.category));
  } else if (lookup.kind === "groupCategory") {
    matched = beans.filter(
      (b) =>
        getBeanGroupKey(b, lookup.axis) === lookup.group &&
        beanHasCategory(b, lookup.category)
    );
  } else {
    const { row, col, axis } = lookup;
    matched = beans.filter((b) => {
      const methods: string[] =
        (b as any).greatOn ?? (b as any).greatAs ?? [];
      const hasMethod = methods.includes(col);
      if (axis === "roaster") return (b.roaster ?? "Unknown") === row && hasMethod;
      if (axis === "notes") {
        if (aggregateNotes) {
          return beanHasCategory(b, row as NoteCategory) && hasMethod;
        }
        return b.notes?.includes(row) && hasMethod;
      }
      if (axis === "varietal") return normaliseField((b as any).varietal) === row && hasMethod;
      if (axis === "process") return normaliseField((b as any).process) === row && hasMethod;
      return false;
    });
  }

  return matched.slice(0, limit).map((b) => ({
    roaster: b.roaster ?? "Unknown",
    name: (b as any).name ?? (b as any).coffee ?? "",
    methods: (b as any).greatOn ?? (b as any).greatAs ?? [],
  }));
}

// How many tabs to show before the card is "collapsed"
const PANEL_TAB_COLLAPSED_COUNT = 8;

export function BeanDashboard({ beans, loadStatus }: BeanDashboardProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [noteOverlay, setNoteOverlay] = useState<HoverOverlayState | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [heatmapAxis, setHeatmapAxis] = useState<ExtendedAxis>("roaster");

  // Panel card state
  const [panelTabAxis, setPanelTabAxis] = useState<PanelTabAxis>("roaster");
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [aggregateNotes, setAggregateNotes] = useState(true);
  const [minSample, setMinSample] = useState(1);
  const [categoryBarAxis, setCategoryBarAxis] = useState<GroupAxis>("roaster");

  // When the tab axis changes, reset tab selection and collapse
  const handlePanelTabAxisChange = (axis: PanelTabAxis) => {
    setPanelTabAxis(axis);
    setSelectedTab(null);
    setPanelExpanded(false);
  };

  // When origin changes, reset tab selection
  const handleOriginSelect = (label: string) => {
    setSelectedOrigin((prev) => (prev === label ? null : label));
    setSelectedTab(null);
  };

  const filteredBeans = useMemo(
    () => filterBeansByOrigin(beans, selectedOrigin),
    [beans, selectedOrigin]
  );

  const originCountsRaw = useMemo(() => getOriginCounts(beans), [beans]);
  const originCoffeeCounts = useMemo(
    () => getGroupCoffeeCounts(beans, "origin"),
    [beans]
  );
  const originCounts = useMemo(
    () => filterEntriesByMinSample(originCountsRaw, originCoffeeCounts, minSample),
    [originCountsRaw, originCoffeeCounts, minSample]
  );

  const noteCountsRaw = useMemo(
    () =>
      aggregateNotes
        ? getNoteCategoryCounts(filteredBeans)
        : getNoteCounts(filteredBeans),
    [filteredBeans, aggregateNotes]
  );
  const noteCoffeeCounts = useMemo(
    () =>
      aggregateNotes
        ? getNoteCategoryCoffeeCounts(filteredBeans)
        : getNoteCoffeeCounts(filteredBeans),
    [filteredBeans, aggregateNotes]
  );
  const noteCounts = useMemo(
    () => filterNoteEntriesByMinSample(noteCountsRaw, noteCoffeeCounts, minSample),
    [noteCountsRaw, noteCoffeeCounts, minSample]
  );

  const notesByGroupRaw = useMemo(
    () =>
      aggregateNotes
        ? getCategoriesByGroup(filteredBeans, panelTabAxis, normaliseField)
        : getNotesByGroup(filteredBeans, panelTabAxis),
    [filteredBeans, panelTabAxis, aggregateNotes]
  );
  const panelGroupCoffeeCounts = useMemo(
    () => getGroupCoffeeCounts(filteredBeans, panelTabAxis),
    [filteredBeans, panelTabAxis]
  );
  const notesByGroup = useMemo(
    () =>
      filterMapByMinSample(notesByGroupRaw, panelGroupCoffeeCounts, minSample),
    [notesByGroupRaw, panelGroupCoffeeCounts, minSample]
  );

  const topNotesWeightedRaw = useMemo(
    () =>
      aggregateNotes
        ? getCategoryCountsWeightedByGreatOn(filteredBeans)
        : getTopNotesWeightedByGreatOn(filteredBeans),
    [filteredBeans, aggregateNotes]
  );
  const topNotesWeighted = useMemo(
    () => filterNoteEntriesByMinSample(topNotesWeightedRaw, noteCoffeeCounts, minSample),
    [topNotesWeightedRaw, noteCoffeeCounts, minSample]
  );

  const heatmapMatrixRaw = useMemo(
    () => buildExtendedMatrix(filteredBeans, heatmapAxis, aggregateNotes),
    [filteredBeans, heatmapAxis, aggregateNotes]
  );
  const heatmapMatrix = useMemo(
    () =>
      filterMatrixByMinSample(
        heatmapMatrixRaw,
        filteredBeans,
        heatmapAxis,
        aggregateNotes,
        minSample
      ),
    [heatmapMatrixRaw, filteredBeans, heatmapAxis, aggregateNotes, minSample]
  );

  const categoryBarsByGroup = useMemo(
    () => getCategoryBarsByGroup(filteredBeans, categoryBarAxis, minSample),
    [filteredBeans, categoryBarAxis, minSample]
  );

  const overlayCoffees = useMemo(() => {
    if (!noteOverlay) return [];
    return getBeansForOverlay(filteredBeans, noteOverlay.lookup, aggregateNotes, 3);
  }, [filteredBeans, noteOverlay, aggregateNotes]);

  const maxNoteCount = noteCounts[0]?.count ?? 1;
  const total = getTotalCoffees(beans);
  const roasterCount = getUniqueRoasterCount(beans);

  // Tab entries (sorted by coffee count, already done in getNotesByGroup)
  const tabEntries = [...notesByGroup.entries()];
  const visibleTabEntries = panelExpanded
    ? tabEntries
    : tabEntries.slice(0, PANEL_TAB_COLLAPSED_COUNT);

  // Active notes for the note cloud
  const activeNotes = selectedTab
    ? (notesByGroup.get(selectedTab) ?? [])
    : topNotesWeighted;

  const panelSubtitle = selectedTab
    ? aggregateNotes
      ? `Most liked flavour categories for ${selectedTab}`
      : `Most liked flavours for ${selectedTab}`
    : aggregateNotes
    ? `Most liked flavour categories across all ${
        panelTabAxis === "roaster"
          ? "roasters"
          : panelTabAxis === "varietal"
          ? "varietals"
          : "processes"
      }. Each 'Great as' gets one point.`
    : `Most liked tasting notes across all ${
        panelTabAxis === "roaster"
          ? "roasters"
          : panelTabAxis === "varietal"
          ? "varietals"
          : "processes"
      }. Each 'Great as' gets one point.`;

  const handleAggregateNotesChange = (checked: boolean) => {
    setAggregateNotes(checked);
    setNoteOverlay(null);
  };

  const handleMinSampleChange = (value: number) => {
    setMinSample(value);
    setNoteOverlay(null);
  };

  useEffect(() => {
    if (selectedOrigin && !originCounts.some((entry) => entry.label === selectedOrigin)) {
      setSelectedOrigin(null);
    }
  }, [selectedOrigin, originCounts]);

  useEffect(() => {
    if (selectedTab && !notesByGroup.has(selectedTab)) {
      setSelectedTab(null);
    }
  }, [selectedTab, notesByGroup]);

  // ── overlay handlers ────────────────────────────────────────────────────

  const showGroupCategoryOverlay = useCallback(
    (group: string, category: NoteCategory, axis: GroupAxis, clientX: number, clientY: number) => {
      setNoteOverlay({
        label: `${group} · ${category}`,
        lookup: { kind: "groupCategory", group, category, axis },
        x: clientX,
        y: clientY,
      });
    },
    []
  );

  const showNoteOverlay = useCallback(
    (label: string, clientX: number, clientY: number) => {
      setNoteOverlay({
        label,
        lookup: aggregateNotes
          ? { kind: "category", category: label as NoteCategory }
          : { kind: "note", note: label },
        x: clientX,
        y: clientY,
      });
    },
    [aggregateNotes]
  );
  const moveNoteOverlay = useCallback((clientX: number, clientY: number) => {
    setNoteOverlay((prev) => (prev ? { ...prev, x: clientX, y: clientY } : null));
  }, []);
  const hideNoteOverlay = useCallback(() => setNoteOverlay(null), []);

  const showCellOverlay = useCallback(
    (row: string, col: string, axis: ExtendedAxis, clientX: number, clientY: number) => {
      setNoteOverlay({ label: `${row} × ${col}`, lookup: { kind: "cell", row, col, axis }, x: clientX, y: clientY });
    },
    []
  );
  const moveCellOverlay = useCallback((clientX: number, clientY: number) => {
    setNoteOverlay((prev) => (prev ? { ...prev, x: clientX, y: clientY } : null));
  }, []);
  const hideCellOverlay = useCallback(() => setNoteOverlay(null), []);

  // ── render guards ─────────────────────────────────────────────────────

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
        <p>No coffees tracked yet. Add your first bag and the charts will fill in.</p>
      </div>
    );
  }

  // ── main render ───────────────────────────────────────────────────────

  return (
    <div className="bean-dashboard">
      <div className="dashboard-toolbar">
        <label className="dashboard-toolbar__control">
          <span className="dashboard-toolbar__label">Minimum sample</span>
          <select
            className="dashboard-toolbar__select"
            value={minSample}
            onChange={(e) => handleMinSampleChange(Number(e.target.value))}
            aria-label="Minimum sample size for visualisations"
          >
            {MIN_SAMPLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}+ {option === 1 ? "coffee" : "coffees"}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-toggle">
          <span className="dashboard-toggle__label">Aggregate tasting notes</span>
          <input
            type="checkbox"
            className="dashboard-toggle__input visually-hidden"
            checked={aggregateNotes}
            onChange={(e) => handleAggregateNotesChange(e.target.checked)}
          />
          <span className="dashboard-toggle__switch" aria-hidden="true" />
        </label>
      </div>

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
            <span className="dashboard-stat__unit">{total === 1 ? "coffee" : "coffees"}</span>
          </p>
          <p className="dashboard-card__meta dashboard-card__meta--compact">
            <strong>{roasterCount}</strong> {roasterCount === 1 ? "roaster" : "roasters"}
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
            {originCounts.length === 0 ? (
              <p className="dashboard-card__meta">No origins meet the minimum sample size.</p>
            ) : (
              <>
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
                        className={`donut-legend__btn${selectedOrigin === entry.label ? " is-selected" : ""}`}
                        onClick={() => handleOriginSelect(entry.label)}
                      >
                        <span
                          className="donut-legend__swatch"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span>{entry.label}</span>
                        <span className="donut-legend__count">{entry.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>

          {/* ── 3. Roasters & Tasting Notes ── */}
          <article
            className={`dashboard-card dashboard-card--origin-notes${activePanel === "roaster-notes" ? " is-active" : ""}`}
            onMouseEnter={() => setActivePanel("roaster-notes")}
            onMouseLeave={() => setActivePanel(null)}
          >
            <header className="dashboard-card__header">
              <div>
                {/* Title row: label + axis selector inline */}
                <h3 className="dashboard-card__title dashboard-card__title--heatmap">
                  <label className="heatmap-axis-label">
                    <span className="visually-hidden">Group by: </span>
                    <select
                      className="heatmap-axis-select"
                      value={panelTabAxis}
                      onChange={(e) => handlePanelTabAxisChange(e.target.value as PanelTabAxis)}
                      aria-label="Panel tab grouping"
                    >
                      <option value="roaster">Roasters</option>
                      <option value="varietal">Varietals</option>
                      <option value="process">Processes</option>
                    </select>
                  </label>
                  <span className="heatmap-axis-suffix"> &amp; tasting notes</span>
                </h3>
                <p className="dashboard-card__subtitle">{panelSubtitle}</p>
              </div>
            </header>

            <div className="origin-notes">
              {/* Tab strip */}
              <div className="origin-notes__tabs" role="tablist">
                {/* "All" pill */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedTab === null}
                  className={`origin-tab${selectedTab === null ? " is-selected" : ""}`}
                  onClick={() => setSelectedTab(null)}
                >
                  All
                </button>

                {visibleTabEntries.map(([groupKey]) => (
                  <button
                    key={groupKey}
                    type="button"
                    role="tab"
                    aria-selected={selectedTab === groupKey}
                    className={`origin-tab${selectedTab === groupKey ? " is-selected" : ""}`}
                    onClick={() =>
                      setSelectedTab((prev) => (prev === groupKey ? null : groupKey))
                    }
                  >
                    {groupKey}
                  </button>
                ))}

                {/* Expand / collapse tab list */}
                {tabEntries.length > PANEL_TAB_COLLAPSED_COUNT && (
                  <button
                    type="button"
                    className="origin-tab origin-tab--more"
                    onClick={() => setPanelExpanded((v) => !v)}
                    aria-label={panelExpanded ? "Show fewer" : `Show all ${tabEntries.length}`}
                  >
                    {panelExpanded ? "← Less" : `+${tabEntries.length - PANEL_TAB_COLLAPSED_COUNT} more`}
                  </button>
                )}
              </div>

              {/* Note cloud panel */}
              <div className="origin-notes__panel">
                <div className="origin-notes__detail">
                  <h4>{selectedTab ?? "Most liked"}</h4>
                  <div className="note-cloud">
                    {activeNotes.length === 0 ? (
                      <p className="dashboard-card__meta">
                        {aggregateNotes ? "No flavour categories yet" : "No notes yet"}
                      </p>
                    ) : (
                      activeNotes.map((note, i) => {
                        const scale =
                          0.75 + (note.count / (activeNotes[0]?.count ?? 1)) * 0.5;
                        const isHovered = noteOverlay?.label === note.label;
                        return (
                          <span
                            key={note.label}
                            className="note-cloud__tag"
                            style={{
                              fontSize: `${scale}rem`,
                              background: CHART_COLORS[i % CHART_COLORS.length],
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
                            <span className="note-cloud__count">{note.count}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
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
              <p className="dashboard-card__subtitle">
                {aggregateNotes ? "Most common flavour categories" : "Most common flavours"}
              </p>
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
            {noteCounts.length === 0 ? (
              <li className="dashboard-card__meta">No notes meet the minimum sample size.</li>
            ) : (
              noteCounts.slice(0, 10).map((entry, i) => {
              const pct = (entry.count / maxNoteCount) * 100;
              const isHovered = noteOverlay?.label === entry.label;
              return (
                <li
                  key={entry.label}
                  className="bar-chart__row"
                  onMouseMove={(e) => { if (isHovered) moveNoteOverlay(e.clientX, e.clientY); }}
                >
                  <button
                    type="button"
                    className={`bar-chart__label${isHovered ? " is-highlight" : ""}`}
                    onMouseEnter={(e) => showNoteOverlay(entry.label, e.clientX, e.clientY)}
                    onMouseMove={(e) => showNoteOverlay(entry.label, e.clientX, e.clientY)}
                    onMouseLeave={hideNoteOverlay}
                    onFocus={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      showNoteOverlay(entry.label, rect.right, rect.top + rect.height / 2);
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
            })
            )}
          </ul>
        </article>

        {/* ── 5. Aggregate categories by group ── */}
        <article
          className={`dashboard-card dashboard-card--category-bars${activePanel === "category-bars" ? " is-active" : ""}`}
          onMouseEnter={() => setActivePanel("category-bars")}
          onMouseLeave={() => setActivePanel(null)}
        >
          <header className="dashboard-card__header">
            <div>
              <h3 className="dashboard-card__title dashboard-card__title--heatmap">
                <label className="heatmap-axis-label">
                  <span className="visually-hidden">Group by: </span>
                  <select
                    className="heatmap-axis-select"
                    value={categoryBarAxis}
                    onChange={(e) => setCategoryBarAxis(e.target.value as GroupAxis)}
                    aria-label="Category bar chart grouping"
                  >
                    <option value="roaster">Roasters</option>
                    <option value="varietal">Varietals</option>
                    <option value="process">Processes</option>
                    <option value="origin">Origins</option>
                  </select>
                </label>
                <span className="heatmap-axis-suffix"> &amp; flavour categories</span>
              </h3>
              <p className="dashboard-card__subtitle">
                Coffees per aggregate tasting note, grouped by{" "}
                {GROUP_AXIS_LABELS[categoryBarAxis].toLowerCase()}
              </p>
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
          <GroupCategoryBarChart
            groups={categoryBarsByGroup}
            axis={categoryBarAxis}
            onCategoryHover={showGroupCategoryOverlay}
            onCategoryMove={moveNoteOverlay}
            onCategoryLeave={hideNoteOverlay}
            activeLabel={noteOverlay?.label ?? null}
          />
        </article>

        {/* ── 6. Heatmap ── */}
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
                    onChange={(e) => setHeatmapAxis(e.target.value as ExtendedAxis)}
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
              heatmapAxis === "roaster" ? "Roaster"
              : heatmapAxis === "notes"
              ? aggregateNotes
                ? "Category"
                : "Note"
              : heatmapAxis === "varietal" ? "Varietal"
              : "Process"
            }
            axis={heatmapAxis}
            onCellOverlay={(row, col, x, y) => showCellOverlay(row, col, heatmapAxis, x, y)}
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
            aggregateNotes={
              aggregateNotes || noteOverlay.lookup.kind === "groupCategory"
            }
          />,
          document.body
        )}
    </div>
  );
}

// ── GroupCategoryBarChart ────────────────────────────────────────────────────

interface GroupCategoryBarChartProps {
  groups: GroupCategoryBars[];
  axis: GroupAxis;
  onCategoryHover: (
    group: string,
    category: NoteCategory,
    axis: GroupAxis,
    clientX: number,
    clientY: number
  ) => void;
  onCategoryMove: (clientX: number, clientY: number) => void;
  onCategoryLeave: () => void;
  activeLabel: string | null;
}

function GroupCategoryBarChart({
  groups,
  axis,
  onCategoryHover,
  onCategoryMove,
  onCategoryLeave,
  activeLabel,
}: GroupCategoryBarChartProps) {
  if (groups.length === 0) {
    return (
      <p className="dashboard-card__meta">
        No groups meet the minimum sample size yet.
      </p>
    );
  }

  return (
    <div className="group-category-bars">
      {groups.map((groupEntry) => {
        const maxCount = groupEntry.categories[0]?.count ?? 1;
        return (
          <section key={groupEntry.group} className="group-category-bars__group">
            <header className="group-category-bars__header">
              <h4 className="group-category-bars__title">{groupEntry.group}</h4>
              <span className="group-category-bars__meta">
                {groupEntry.coffeeCount}{" "}
                {groupEntry.coffeeCount === 1 ? "coffee" : "coffees"}
              </span>
            </header>
            {groupEntry.categories.length === 0 ? (
              <p className="dashboard-card__meta">No flavour categories yet</p>
            ) : (
              <ul className="bar-chart bar-chart--compact" role="list">
                {groupEntry.categories.map((entry) => {
                  const pct = (entry.count / maxCount) * 100;
                  const label = `${groupEntry.group} · ${entry.label}`;
                  const isHovered = activeLabel === label;
                  const color =
                    CATEGORY_COLORS[entry.label as NoteCategory] ?? CHART_COLORS[0];
                  return (
                    <li
                      key={entry.label}
                      className="bar-chart__row"
                      onMouseMove={(e) => {
                        if (isHovered) onCategoryMove(e.clientX, e.clientY);
                      }}
                    >
                      <button
                        type="button"
                        className={`bar-chart__label${isHovered ? " is-highlight" : ""}`}
                        onMouseEnter={(e) =>
                          onCategoryHover(
                            groupEntry.group,
                            entry.label as NoteCategory,
                            axis,
                            e.clientX,
                            e.clientY
                          )
                        }
                        onMouseMove={(e) =>
                          onCategoryHover(
                            groupEntry.group,
                            entry.label as NoteCategory,
                            axis,
                            e.clientX,
                            e.clientY
                          )
                        }
                        onMouseLeave={onCategoryLeave}
                      >
                        {entry.label}
                      </button>
                      <div className="bar-chart__track" aria-hidden>
                        <span
                          className="bar-chart__fill"
                          style={{
                            width: `${pct}%`,
                            background: color,
                            opacity: isHovered || !activeLabel ? 1 : 0.35,
                          }}
                        />
                      </div>
                      <span className="bar-chart__count">{entry.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ── NoteCoffeeOverlay ────────────────────────────────────────────────────────

interface NoteCoffeeOverlayProps {
  label: string;
  x: number;
  y: number;
  coffees: { roaster: string; name: string; methods: string[] }[];
  aggregateNotes: boolean;
}

function NoteCoffeeOverlay({ label, x, y, coffees, aggregateNotes }: NoteCoffeeOverlayProps) {
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
        <p className="note-coffee-overlay__empty">
          {aggregateNotes ? "No coffees in this category" : "No coffees with this note"}
        </p>
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
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--cream-mid)" strokeWidth={stroke} />
      {entries.map((entry, i) => {
        const fraction = entry.count / total;
        const dash = fraction * circumference;
        const isSelected = selected === entry.label;
        const segment = (
          <circle
            key={entry.label}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={isSelected ? selectedStroke : stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className={`donut-segment${selected && !isSelected ? " is-dimmed" : ""}${isSelected ? " is-selected" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(entry.label)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(entry.label); }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${entry.label}: ${entry.count}`}
          />
        );
        offset += dash;
        return segment;
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="donut-chart__center">
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

function Heatmap({ matrix, rowLabel, axis: _axis, onCellOverlay, onCellOverlayMove, onCellOverlayHide }: HeatmapProps) {
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
      <div className="heatmap-grid" style={{ gridTemplateColumns }} role="table" aria-label="Brew-method heatmap">
        <div className="heatmap__corner" role="columnheader">{rowLabel} / Method</div>
        {cols.map((col) => (
          <div key={col} className="heatmap__col-head" role="columnheader">{col}</div>
        ))}
        {rows.map((row) => (
          <>
            <div key={`${row}--head`} className="heatmap__row-head" role="rowheader">{row}</div>
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
                    background: count > 0
                      ? `color-mix(in srgb, var(--yellow) ${Math.round(20 + intensity * 70)}%, var(--pink-soft))`
                      : undefined,
                    cursor: count ? "pointer" : "default",
                  }}
                  aria-label={count ? `${row}, ${col}: ${count}` : `${row}, ${col}: no data`}
                  onMouseEnter={(e) => {
                    if (!count) return;
                    setHovered({ row, col, count });
                    onCellOverlay(row, col, e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => { if (!count) return; onCellOverlayMove(e.clientX, e.clientY); }}
                  onMouseLeave={() => { setHovered(null); onCellOverlayHide(); }}
                  onFocus={(e) => {
                    if (!count) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHovered({ row, col, count });
                    onCellOverlay(row, col, rect.right, rect.top);
                  }}
                  onBlur={() => { setHovered(null); onCellOverlayHide(); }}
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