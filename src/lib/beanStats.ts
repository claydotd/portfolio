export interface BeanRecord {
  id: number;
  roaster: string;
  name: string;
  origin: string;
  notes: string[];
  greatOn: string[];
}

export interface CountEntry {
  label: string;
  count: number;
}

export interface MatrixCell {
  row: string;
  col: string;
  count: number;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function displayLabel(value: string): string {
  const t = value.trim();
  if (!t) return "Unknown";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function countOccurrences(values: string[]): CountEntry[] {
  const map = new Map<string, { label: string; count: number }>();

  for (const raw of values) {
    const key = normalizeKey(raw);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { label: displayLabel(raw), count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getTotalCoffees(beans: BeanRecord[]): number {
  return beans.length;
}

export function getUniqueRoasterCount(beans: BeanRecord[]): number {
  return new Set(beans.map((b) => normalizeKey(b.roaster)).filter(Boolean)).size;
}

export function getNoteCounts(beans: BeanRecord[]): CountEntry[] {
  return countOccurrences(beans.flatMap((b) => b.notes));
}

export function getOriginCounts(beans: BeanRecord[]): CountEntry[] {
  return countOccurrences(
    beans.map((b) => (b.origin.trim() ? b.origin : "Unknown"))
  );
}

export function getNotesByOrigin(beans: BeanRecord[]): Map<string, CountEntry[]> {
  const byOrigin = new Map<string, { label: string; notes: string[] }>();

  for (const bean of beans) {
    const origin = bean.origin.trim() ? bean.origin : "Unknown";
    const key = normalizeKey(origin);
    const existing = byOrigin.get(key);
    if (existing) {
      existing.notes.push(...bean.notes);
    } else {
      byOrigin.set(key, { label: displayLabel(origin), notes: [...bean.notes] });
    }
  }

  const result = new Map<string, CountEntry[]>();
  for (const { label, notes } of byOrigin.values()) {
    result.set(label, countOccurrences(notes));
  }

  return result;
}

export function buildCorrelationMatrix(
  beans: BeanRecord[],
  rowField: "notes" | "roaster"
): { rows: string[]; cols: string[]; cells: MatrixCell[]; max: number } {
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const counts = new Map<string, number>();

  for (const bean of beans) {
    const rows =
      rowField === "notes"
        ? bean.notes
        : [bean.roaster.trim() || "Unknown"];
    const cols = bean.greatOn;

    for (const row of rows) {
      const rowKey = normalizeKey(row);
      if (!rowKey) continue;
      rowSet.add(displayLabel(row));

      for (const col of cols) {
        const colKey = normalizeKey(col);
        if (!colKey) continue;
        colSet.add(col.trim());

        const key = `${rowKey}::${colKey}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  const rows = [...rowSet].sort((a, b) => a.localeCompare(b));
  const cols = [...colSet].sort((a, b) => a.localeCompare(b));
  const cells: MatrixCell[] = [];
  let max = 0;

  for (const row of rows) {
    for (const col of cols) {
      const key = `${normalizeKey(row)}::${normalizeKey(col)}`;
      const count = counts.get(key) ?? 0;
      if (count > 0) {
        cells.push({ row, col, count });
        max = Math.max(max, count);
      }
    }
  }

  return { rows, cols, cells, max: max || 1 };
}

export function filterBeansByOrigin(
  beans: BeanRecord[],
  origin: string | null
): BeanRecord[] {
  if (!origin) return beans;
  const key = normalizeKey(origin);
  return beans.filter((b) => normalizeKey(b.origin || "Unknown") === key);
}

export interface CoffeeForNote {
  roaster: string;
  name: string;
  methodCount: number;
  methods: string[];
}

/** Coffees containing a note, ranked by how many brew methods they shine on. */
export function getTopCoffeesForNote(
  beans: BeanRecord[],
  noteLabel: string,
  limit = 3
): CoffeeForNote[] {
  const key = normalizeKey(noteLabel);

  return beans
    .filter((b) => b.notes.some((n) => normalizeKey(n) === key))
    .sort(
      (a, b) =>
        b.greatOn.length - a.greatOn.length ||
        a.roaster.localeCompare(b.roaster) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, limit)
    .map((b) => ({
      roaster: b.roaster,
      name: b.name,
      methodCount: b.greatOn.length,
      methods: b.greatOn,
    }));
}

export type HeatmapRowAxis = "roaster" | "notes";
