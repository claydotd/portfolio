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

export const NOTE_CATEGORIES = [
  "Fruity",
  "Nutty",
  "Sweet",
  "Floral",
  "Spicy",
  "Earthy",
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<NoteCategory, string[]> = {
  Fruity: [
    "fruit",
    "berry",
    "cherry",
    "mango",
    "peach",
    "lemon",
    "lime",
    "orange",
    "apple",
    "grape",
    "plum",
    "apricot",
    "banana",
    "cranberry",
    "raspberry",
    "stonefruit",
    "stone fruit",
    "forest fruit",
    "dried fruit",
    "raisin",
    "citrus",
    "tropical",
    "pineapple",
    "passion",
    "guava",
    "blueberry",
    "strawberry",
    "blackcurrant",
    "currant",
    "nectarine",
    "melon",
    "fig",
    "date",
    "pomegranate",
    "lychee",
    "kiwi",
    "grapefruit",
    "tangerine",
  ],
  Nutty: [
    "nut",
    "almond",
    "hazelnut",
    "peanut",
    "walnut",
    "pecan",
    "pistachio",
    "cashew",
    "macadamia",
    "marzipan",
    "nougat",
  ],
  Sweet: [
    "caramel",
    "chocolate",
    "honey",
    "sugar",
    "fudge",
    "vanilla",
    "toffee",
    "maple",
    "molasses",
    "biscuit",
    "cookie",
    "cake",
    "syrup",
    "cocoa",
    "brown sugar",
    "sweet",
    "candy",
    "butterscotch",
    "praline",
  ],
  Floral: [
    "floral",
    "flower",
    "jasmine",
    "honeysuckle",
    "rose",
    "lavender",
    "bergamot",
    "chamomile",
    "elderflower",
    "violet",
    "hibiscus",
  ],
  Spicy: [
    "spice",
    "spicy",
    "cinnamon",
    "clove",
    "cardamom",
    "pepper",
    "anise",
    "nutmeg",
    "ginger",
    "allspice",
    "coriander",
  ],
  Earthy: [
    "earth",
    "herb",
    "herbaceous",
    "woody",
    "tobacco",
    "cedar",
    "moss",
    "forest",
    "mushroom",
    "savory",
    "vegetal",
    "green",
    "hay",
    "leather",
    "smoke",
    "smoky",
    "peat",
  ],
};

function keywordMatches(normalized: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/(\w+)$/, "$1s?");
  return new RegExp(`\\b${pattern}\\b`).test(normalized);
}

/** Map a tasting note to one of the broad flavour categories, if recognised. */
export function getNoteCategory(note: string): NoteCategory | null {
  const normalized = note.trim().toLowerCase();
  if (!normalized) return null;

  for (const category of NOTE_CATEGORIES) {
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (keywordMatches(normalized, keyword)) {
        return category;
      }
    }
  }

  return null;
}

function getBeanCategories(notes: string[]): Set<NoteCategory> {
  const categories = new Set<NoteCategory>();
  for (const note of notes) {
    const category = getNoteCategory(note);
    if (category) categories.add(category);
  }
  return categories;
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

export function getNoteCategoryCounts(beans: BeanRecord[]): CountEntry[] {
  const map = new Map<NoteCategory, number>();

  for (const bean of beans) {
    for (const note of bean.notes) {
      const category = getNoteCategory(note);
      if (!category) continue;
      map.set(category, (map.get(category) ?? 0) + 1);
    }
  }

  return NOTE_CATEGORIES.map((label) => ({
    label,
    count: map.get(label) ?? 0,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Categories on a bean, weighted by how many brew methods it shines on. */
export function getCategoryCountsWeightedByGreatOn(
  beans: BeanRecord[]
): CountEntry[] {
  const map = new Map<NoteCategory, number>();

  for (const bean of beans) {
    const weight = bean.greatOn?.length ?? 1;
    for (const category of getBeanCategories(bean.notes)) {
      map.set(category, (map.get(category) ?? 0) + weight);
    }
  }

  return NOTE_CATEGORIES.map((label) => ({
    label,
    count: map.get(label) ?? 0,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getCategoriesByGroup(
  beans: BeanRecord[],
  axis: "roaster" | "varietal" | "process",
  normaliseField: (value: string | undefined | null) => string
): Map<string, CountEntry[]> {
  const groupCategories = new Map<string, Map<NoteCategory, number>>();
  const groupCoffeeCount = new Map<string, number>();

  for (const bean of beans) {
    const groupKey =
      axis === "roaster"
        ? bean.roaster.trim() || "Unknown"
        : normaliseField((bean as Record<string, string | undefined>)[axis]);

    groupCoffeeCount.set(groupKey, (groupCoffeeCount.get(groupKey) ?? 0) + 1);

    if (!groupCategories.has(groupKey)) {
      groupCategories.set(groupKey, new Map());
    }
    const categoryMap = groupCategories.get(groupKey)!;
    const weight = bean.greatOn?.length ?? 1;

    for (const category of getBeanCategories(bean.notes)) {
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + weight);
    }
  }

  const result = new Map<string, CountEntry[]>();
  const sortedEntries = [...groupCategories.entries()].sort(
    (a, b) => (groupCoffeeCount.get(b[0]) ?? 0) - (groupCoffeeCount.get(a[0]) ?? 0)
  );

  for (const [groupKey, categoryMap] of sortedEntries) {
    const sorted = NOTE_CATEGORIES.map((label) => ({
      label,
      count: categoryMap.get(label) ?? 0,
    }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    result.set(groupKey, sorted);
  }

  return result;
}

export function buildCategoryCorrelationMatrix(
  beans: BeanRecord[]
): { rows: string[]; cols: string[]; cells: MatrixCell[]; max: number } {
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const counts = new Map<string, number>();

  for (const bean of beans) {
    const categories = getBeanCategories(bean.notes);
    for (const category of categories) {
      rowSet.add(category);
    }

    for (const col of bean.greatOn) {
      const colKey = normalizeKey(col);
      if (!colKey) continue;
      colSet.add(col.trim());

      for (const category of categories) {
        const key = `${normalizeKey(category)}::${colKey}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  const rows = NOTE_CATEGORIES.filter((category) => rowSet.has(category));
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

export function beanHasCategory(bean: BeanRecord, category: NoteCategory): boolean {
  return getBeanCategories(bean.notes).has(category);
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
