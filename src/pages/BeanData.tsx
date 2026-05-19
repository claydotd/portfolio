import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { BeanDashboard } from "../components/BeanDashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bean {
  id: number;
  roaster: string;
  name: string;
  origin: string;
  varietal: string;
  process: string;
  datePurchased: string;
  notes: string[];
  greatOn: string[];
}

interface FormState {
  roaster: string;
  name: string;
  origin: string;
  varietal: string;
  process: string;
  datePurchased: string;
  notes: string;
  greatOn: string[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ---------------------------------------------------------------------------
// Column filter/sort types
// ---------------------------------------------------------------------------

type SortDir = "asc" | "desc" | null;

type ColumnKey =
  | "id"
  | "roaster"
  | "name"
  | "origin"
  | "varietal"
  | "process"
  | "datePurchased"
  | "notes"
  | "greatOn";

interface ColumnFilter {
  sort: SortDir;
  selected: Set<string>;
}

type FilterState = Partial<Record<ColumnKey, ColumnFilter>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BREW_METHODS = [
  "Pour Over",
  "Espresso",
  "Latte",
  "Aeropress",
  "French Press",
] as const;

const COLUMNS: { key: ColumnKey; label: string; sortable: boolean }[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "roaster", label: "Roaster", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "origin", label: "Origin", sortable: true },
  { key: "varietal", label: "Varietal", sortable: true },
  { key: "process", label: "Process", sortable: true },
  { key: "datePurchased", label: "Date", sortable: true },
  { key: "notes", label: "Notes", sortable: false },
  { key: "greatOn", label: "Great As", sortable: false },
];

const BEAN_DATA_PLAN = [
  {
    id: 1,
    title: "Create a database of my coffee bean purchases",
    description:
      "I'll start by creating a database to store all the roasts purchased and their details.",
    status: "done",
  },
  {
    id: 2,
    title: "Create an interface to add new purchases and add review notes",
    description:
      "Next, I want to dynamically add new roasts to the database and add review notes.",
    status: "done",
  },
  {
    id: 3,
    title: "Create a dashboard to visualise the data",
    description:
      "After that, I'll be creating an overview dashboard to visualise the data. This will include filtering and dynamically updating visuals.",
    status: "done",
  },
  {
    id: 4,
    title: "Add interactive visualisations",
    description:
      "Once everything else is working, I want to add some more creative and interactive ways of visualising the data.",
    status: "not started",
  },
  {
    id: 5,
    title: "Add a way to export the data",
    description:
      "At the end of the project, I want to add a way to export the data in a variety of formats so that others can access and use the data themselves.",
    status: "not started",
  },
];

const EMPTY_FORM: FormState = {
  roaster: "",
  name: "",
  origin: "",
  varietal: "",
  process: "",
  datePurchased: "",
  notes: "",
  greatOn: [],
};

// ---------------------------------------------------------------------------
// Netlify DB config
// ---------------------------------------------------------------------------

const NETLIFY_DB_URL = "/.netlify/functions/database";

// ---------------------------------------------------------------------------
// Auth config
// ---------------------------------------------------------------------------

const LOGIN_CONFIG = {
  username: import.meta.env.VITE_LOGIN_USERNAME as string,
  password: import.meta.env.VITE_LOGIN_PASSWORD as string,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function beanToForm(bean: Bean): FormState {
  return {
    roaster: bean.roaster ?? "",
    name: bean.name ?? "",
    origin: bean.origin ?? "",
    varietal: bean.varietal ?? "",
    process: bean.process ?? "",
    datePurchased: bean.datePurchased ?? "",
    notes: Array.isArray(bean.notes) ? bean.notes.join(", ") : bean.notes ?? "",
    greatOn: Array.isArray(bean.greatOn) ? bean.greatOn : [],
  };
}

function formToBean(form: FormState, id: number): Bean {
  return {
    id,
    roaster: form.roaster.trim(),
    name: form.name.trim(),
    origin: form.origin.trim(),
    varietal: form.varietal.trim(),
    process: form.process.trim(),
    datePurchased: form.datePurchased.trim(),
    notes: form.notes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    greatOn: form.greatOn,
  };
}

/** Get a flat string representation of a bean cell for filtering/sorting */
function getCellValue(bean: Bean, key: ColumnKey): string {
  const v = bean[key];
  if (Array.isArray(v)) return v.join(", ");
  return String(v ?? "");
}

/** Collect all unique values for a given column across all beans */
function getUniqueValues(beans: Bean[], key: ColumnKey): string[] {
  const set = new Set<string>();
  for (const bean of beans) {
    const v = bean[key];
    if (Array.isArray(v)) {
      v.forEach((item) => set.add(item));
    } else {
      const str = String(v ?? "").trim();
      if (str) set.add(str);
    }
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Netlify DB API helpers
// ---------------------------------------------------------------------------

async function fetchBeansFromNetlify(): Promise<Bean[]> {
  const res = await fetch(`${NETLIFY_DB_URL}?all=true`);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = (errBody as { message?: string }).message;
    throw new Error(
      detail?.trim() ? detail : `Failed to fetch beans: ${res.status}`
    );
  }
  const { beans }: { beans: Bean[] } = await res.json();
  return beans ?? [];
}

async function saveBeanToNetlify(bean: Bean): Promise<void> {
  const key = `bean-${bean.id}`;
  const res = await fetch(`${NETLIFY_DB_URL}?key=${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(bean) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to save bean: ${res.status} ${
        (err as { message?: string }).message ?? ""
      }`
    );
  }
}

// ---------------------------------------------------------------------------
// ColumnFilterOverlay component
// ---------------------------------------------------------------------------

interface ColumnFilterOverlayProps {
  column: { key: ColumnKey; label: string; sortable: boolean };
  beans: Bean[];
  current: ColumnFilter | undefined;
  anchorRef: React.RefObject<HTMLElement>;
  onApply: (key: ColumnKey, filter: ColumnFilter) => void;
  onClear: (key: ColumnKey) => void;
  onClose: () => void;
}

function ColumnFilterOverlay({
  column,
  beans,
  current,
  anchorRef,
  onApply,
  onClear,
  onClose,
}: ColumnFilterOverlayProps) {
  const [sort, setSort] = useState<SortDir>(current?.sort ?? null);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(current?.selected ?? [])
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const uniqueValues = getUniqueValues(beans, column.key);

  // Use fixed positioning so the panel escapes <th> layout constraints.
  // Recompute on scroll/resize so it tracks the header button.
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const updatePos = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  };
  useEffect(() => {
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use 'click' (not 'mousedown') and defer by one tick so the header
  // button's own onClick toggle fires first — preventing instant re-close.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insidePanel = panelRef.current?.contains(target) ?? false;
      const insideAnchor = anchorRef.current?.contains(target) ?? false;
      if (!insidePanel && !insideAnchor) onClose();
    };
    const timer = setTimeout(
      () => document.addEventListener("click", handler),
      0
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [onClose, anchorRef]);

  const toggleValue = (v: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const handleApply = () => {
    onApply(column.key, { sort, selected });
    onClose();
  };

  const handleClear = () => {
    onClear(column.key);
    onClose();
  };

  // Portal to document.body so the panel is never clipped by table overflow
  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      className="col-filter-panel"
      style={{ position: "fixed", top: pos.top, left: pos.left }}
      role="dialog"
      aria-label={`Filter by ${column.label}`}
    >
      <div className="col-filter-header">
        <span className="col-filter-title">{column.label}</span>
        <button
          className="col-filter-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {column.sortable && (
        <div className="col-filter-section">
          <p className="col-filter-section-label">Sort</p>
          <div className="col-filter-sort-btns">
            <button
              className={`col-filter-sort-btn${sort === "asc" ? " active" : ""}`}
              onClick={() => setSort(sort === "asc" ? null : "asc")}
            >
              ↑ A → Z
            </button>
            <button
              className={`col-filter-sort-btn${sort === "desc" ? " active" : ""}`}
              onClick={() => setSort(sort === "desc" ? null : "desc")}
            >
              ↓ Z → A
            </button>
          </div>
        </div>
      )}

      {uniqueValues.length > 0 && (
        <div className="col-filter-section">
          <p className="col-filter-section-label">
            Filter
            {selected.size > 0 && (
              <span className="col-filter-count">{selected.size} selected</span>
            )}
          </p>
          <div className="col-filter-values">
            {uniqueValues.map((v) => (
              <label key={v} className="col-filter-value-row">
                <input
                  type="checkbox"
                  checked={selected.has(v)}
                  onChange={() => toggleValue(v)}
                />
                <span>{v}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="col-filter-footer">
        <button className="btn ghost small" onClick={handleClear}>
          Clear
        </button>
        <button className="btn primary small" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const BeanData = () => {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showDatabase, setShowDatabase] = useState(false);

  // ---- column filter/sort state -------------------------------------------
  const [filterState, setFilterState] = useState<FilterState>({});
  const [activeFilterCol, setActiveFilterCol] = useState<ColumnKey | null>(null);
  const colHeaderRefs = useRef<Partial<Record<ColumnKey, HTMLButtonElement>>>({});

  // ---- load beans on mount ------------------------------------------------

  useEffect(() => {
    fetchBeansFromNetlify()
      .then((data) => {
        setBeans(data);
        setLoadStatus("ready");
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unknown error");
        setLoadStatus("error");
      });
  }, []);

  // ---- derive filtered + sorted beans -------------------------------------

  const displayedBeans = (() => {
    let result = [...beans];

    // Apply value filters
    for (const [keyStr, colFilter] of Object.entries(filterState)) {
      const key = keyStr as ColumnKey;
      if (!colFilter || colFilter.selected.size === 0) continue;
      result = result.filter((bean) => {
        const v = bean[key];
        if (Array.isArray(v)) return v.some((item) => colFilter.selected.has(item));
        return colFilter.selected.has(String(v ?? "").trim());
      });
    }

    // Apply sort — last column with a sort wins
    for (const [keyStr, colFilter] of Object.entries(filterState)) {
      const key = keyStr as ColumnKey;
      if (!colFilter?.sort) continue;
      const dir = colFilter.sort === "asc" ? 1 : -1;
      result.sort(
        (a, b) =>
          getCellValue(a, key).localeCompare(getCellValue(b, key), undefined, {
            numeric: true,
          }) * dir
      );
    }

    return result;
  })();

  const activeFilterCount = Object.values(filterState).filter(
    (f) => f && (f.sort !== null || f.selected.size > 0)
  ).length;

  // ---- filter helpers -----------------------------------------------------

  const handleFilterApply = (key: ColumnKey, filter: ColumnFilter) => {
    setFilterState((prev) => ({ ...prev, [key]: filter }));
  };

  const handleFilterClear = (key: ColumnKey) => {
    setFilterState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearAllFilters = () => setFilterState({});

  const openColumnFilter = (key: ColumnKey) => {
    setActiveFilterCol((prev) => (prev === key ? null : key));
  };

  // ---- form helpers -------------------------------------------------------

  const openAdd = () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveStatus("idle");
    setSaveError(null);
    setOverlayOpen(true);
  };

  const openEdit = (bean: Bean) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setEditingId(bean.id);
    setForm(beanToForm(bean));
    setErrors({});
    setSaveStatus("idle");
    setSaveError(null);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveStatus("idle");
    setSaveError(null);
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.roaster.trim()) e.roaster = "Roaster is required.";
    if (!form.name.trim()) e.name = "Name is required.";
    return e;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleGreatOnToggle = (method: string) => {
    setForm((prev) => {
      const exists = prev.greatOn.includes(method);
      return {
        ...prev,
        greatOn: exists
          ? prev.greatOn.filter((m) => m !== method)
          : [...prev.greatOn, method],
      };
    });
  };

  const handleLogin = () => {
    if (
      loginForm.username === LOGIN_CONFIG.username &&
      loginForm.password === LOGIN_CONFIG.password
    ) {
      setIsAuthenticated(true);
      setLoginOpen(false);
      setLoginError("");
      setLoginForm({ username: "", password: "" });
      return;
    }
    setLoginError("Invalid username or password.");
  };

  // ---- submit -------------------------------------------------------------

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    try {
      let beanToSave: Bean;

      if (editingId !== null) {
        beanToSave = formToBean(form, editingId);
        setBeans((prev) =>
          prev.map((b) => (b.id === editingId ? beanToSave : b))
        );
      } else {
        const match = beans.find(
          (b) =>
            b.roaster.toLowerCase() === form.roaster.trim().toLowerCase() &&
            b.name.toLowerCase() === form.name.trim().toLowerCase()
        );

        if (match) {
          beanToSave = formToBean(form, match.id);
          setBeans((prev) =>
            prev.map((b) => (b.id === match.id ? beanToSave : b))
          );
        } else {
          const newId =
            beans.length > 0 ? Math.max(...beans.map((b) => b.id)) + 1 : 1;
          beanToSave = formToBean(form, newId);
          setBeans((prev) => [...prev, beanToSave]);
        }
      }

      await saveBeanToNetlify(beanToSave);
      setSaveStatus("saved");
      setTimeout(() => {
        closeOverlay();
      }, 900);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // ---- labels -------------------------------------------------------------

  const overlayTitle =
    editingId !== null ? "Edit Coffee Entry" : "Add New Coffee";

  const submitLabel = () => {
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "saved") return "Saved ✓";
    if (saveStatus === "error") return "Retry";
    return editingId !== null ? "Save Changes" : "Add Coffee";
  };

  // ---- column header render helper ----------------------------------------

  const renderColHeader = (col: typeof COLUMNS[number]) => {
    const isActive = activeFilterCol === col.key;
    const hasFilter =
      (filterState[col.key]?.sort ?? null) !== null ||
      (filterState[col.key]?.selected?.size ?? 0) > 0;
    const sortDir = filterState[col.key]?.sort ?? null;

    return (
      <th key={col.key} className={`col-th${hasFilter ? " col-th--active" : ""}`}>
        <button
          ref={(el) => {
            if (el) colHeaderRefs.current[col.key] = el;
          }}
          className={`col-th-btn${isActive ? " col-th-btn--open" : ""}`}
          onClick={() => openColumnFilter(col.key)}
          aria-pressed={isActive}
        >
          <span>{col.label}</span>
          <span className="col-th-icons">
            {sortDir === "asc" && <span className="col-sort-indicator">↑</span>}
            {sortDir === "desc" && <span className="col-sort-indicator">↓</span>}
            {hasFilter && !sortDir && <span className="col-filter-dot" />}
            <span className="col-th-chevron">{isActive ? "▲" : "▼"}</span>
          </span>
        </button>

        {isActive && (
          <ColumnFilterOverlay
            column={col}
            beans={beans}
            current={filterState[col.key]}
            anchorRef={
              {
                current: colHeaderRefs.current[col.key] ?? null,
              } as React.RefObject<HTMLElement>
            }
            onApply={handleFilterApply}
            onClear={handleFilterClear}
            onClose={() => setActiveFilterCol(null)}
          />
        )}
      </th>
    );
  };

  // ---- render -------------------------------------------------------------

  return (
    <section className="page">
      <header className="hero">
        <div className="hero-left">
          <p className="pill">BeanData · Coffee Bean Data Visualisation</p>
          <h1>Bean Data</h1>
          <p className="subtitle">
            This project is all about visualising data from my coffee bean
            purchases. I'm using this project to experiment with data
            visualisation.
          </p>
        </div>
      </header>

      <section className="section section--dashboard">
        <h2>Data Dashboard</h2>
        <p className="section-subtitle">
          Explore patterns in the data! I'm using this to try and find any
          patterns in coffee preferences. You can see the data below, and add
          to the database if I've given you the credentials.
        </p>
        <BeanDashboard beans={beans} loadStatus={loadStatus} />
        <div className="dashboard-reveal">
          <button
            type="button"
            className="btn primary dashboard-reveal__btn"
            onClick={() => setShowDatabase((prev) => !prev)}
            aria-expanded={showDatabase}
          >
            {showDatabase ? "Hide data" : "Show me the data"}
          </button>
        </div>
      </section>

      {showDatabase && (
        <section className="section section--database bean-database-reveal">
          <h2>The database</h2>
          <p>
            I'm using Netlify DB to store the data. Here is a table with the
            contents of the database.
          </p>

          <div className="table-toolbar">
            <button className="btn btn-add" onClick={openAdd}>+</button>

            {!isAuthenticated ? (
              <button className="btn ghost" onClick={() => setLoginOpen(true)}>
                Login
              </button>
            ) : (
              <span className="pill">Spill the beans</span>
            )}

            {activeFilterCount > 0 && (
              <button
                className="btn ghost small col-filter-clear-all"
                onClick={clearAllFilters}
              >
                Clear {activeFilterCount} filter
                {activeFilterCount > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {loadStatus === "loading" && (
            <p className="load-status">Loading beans…</p>
          )}
          {loadStatus === "error" && (
            <p className="overlay-error">
              ✕ Failed to load beans: {loadError}
            </p>
          )}

          {loadStatus === "ready" && (
            <div className="bean-data-display">
              {/* Desktop table */}
              <div className="table-wrapper desktop-only">
                <table className="bean-table">
                  <thead>
                    <tr>
                      {COLUMNS.map(renderColHeader)}
                      {isAuthenticated && <th>Edit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBeans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            COLUMNS.length + (isAuthenticated ? 1 : 0)
                          }
                          className="no-results"
                        >
                          No beans match the current filters.
                        </td>
                      </tr>
                    ) : (
                      displayedBeans.map((bean) => (
                        <tr key={bean.id}>
                          <td>{bean.id}</td>
                          <td>{bean.roaster}</td>
                          <td>{bean.name}</td>
                          <td>{bean.origin}</td>
                          <td>{bean.varietal}</td>
                          <td>{bean.process}</td>
                          <td>{bean.datePurchased}</td>
                          <td>
                            <ul>
                              {bean.notes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <ul>
                              {bean.greatOn.map((method) => (
                                <li key={method}>{method}</li>
                              ))}
                            </ul>
                          </td>
                          {isAuthenticated && (
                            <td>
                              <button
                                className="btn btn-edit"
                                onClick={() => openEdit(bean)}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mobile-cards mobile-only">
                {displayedBeans.length === 0 ? (
                  <p className="no-results">
                    No beans match the current filters.
                  </p>
                ) : (
                  displayedBeans.map((bean) => (
                    <article className="bean-card" key={bean.id}>
                      <div className="bean-card-header">
                        <span className="bean-id">#{bean.id}</span>
                        <h3>
                          {bean.roaster} · {bean.name}
                        </h3>
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Origin</span>
                        <p>{bean.origin || "—"}</p>
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Varietal</span>
                        <p>{bean.varietal}</p>
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Process</span>
                        <p>{bean.process || "—"}</p>
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Date</span>
                        <p>{bean.datePurchased || "—"}</p>
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Notes</span>
                        {bean.notes.length > 0 ? (
                          <ul>
                            {bean.notes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>—</p>
                        )}
                      </div>

                      <div className="bean-card-section">
                        <span className="bean-card-label">Great As</span>
                        {bean.greatOn.length > 0 ? (
                          <div className="bean-tags">
                            {bean.greatOn.map((method) => (
                              <span className="bean-tag" key={method}>
                                {method}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p>—</p>
                        )}
                      </div>

                      {isAuthenticated && (
                        <button
                          className="btn btn-edit bean-card-edit"
                          onClick={() => openEdit(bean)}
                        >
                          Edit
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Add / Edit overlay ─────────────────────────────────────────── */}
      {overlayOpen && (
        <div className="overlay-backdrop" onClick={closeOverlay}>
          <div
            className="overlay-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={overlayTitle}
          >
            <div className="overlay-header">
              <h3>{overlayTitle}</h3>
              <button
                className="overlay-close"
                onClick={closeOverlay}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="overlay-body">
              <Field
                label="Roaster"
                value={form.roaster}
                onChange={(v) => handleChange("roaster", v)}
                error={errors.roaster}
                required
              />
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => handleChange("name", v)}
                error={errors.name}
                required
              />
              <Field
                label="Origin"
                value={form.origin}
                onChange={(v) => handleChange("origin", v)}
              />
              <Field
                label="Varietal"
                value={form.varietal}
                onChange={(v) => handleChange("varietal", v)}
                placeholder="Paraneima, Bourbon, etc."
                hint="The coffee plant variety."
              />
              <Field
                label="Process"
                value={form.process}
                onChange={(v) => handleChange("process", v)}
                placeholder="Washed, Anerobic Honey, etc..."
                hint="How the beans are processed."
              />
              <Field
                label="Date"
                type="date"
                value={form.datePurchased}
                onChange={(v) => handleChange("datePurchased", v)}
              />
              <Field
                label="Notes"
                value={form.notes}
                onChange={(v) => handleChange("notes", v)}
                placeholder="Comma-separated, e.g. chocolate, fruity, floral"
                hint="Tasting notes from the roaster."
              />

              <div className="field">
                <label className="field-label">Great As</label>
                <div className="checkbox-group">
                  {BREW_METHODS.map((method) => (
                    <label key={method} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={form.greatOn.includes(method)}
                        onChange={() => handleGreatOnToggle(method)}
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
                <span className="field-hint">
                  Which methods made a{" "}
                  <span style={{ fontStyle: "italic" }}>great</span> cup of
                  coffee?
                </span>
              </div>

              {editingId === null && (
                <p className="overlay-hint">
                  If a coffee with the same roaster and name already exists,
                  its entry will be updated instead of creating a duplicate.
                </p>
              )}

              {saveStatus === "error" && saveError && (
                <p className="overlay-error">✕ {saveError}</p>
              )}
            </div>

            <div className="overlay-footer">
              <button className="btn btn-cancel" onClick={closeOverlay}>
                Cancel
              </button>
              <button
                className={`btn btn-submit btn-submit--${saveStatus}`}
                onClick={handleSubmit}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
              >
                {submitLabel()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Login overlay ──────────────────────────────────────────────── */}
      {loginOpen && (
        <div className="overlay-backdrop" onClick={() => setLoginOpen(false)}>
          <div
            className="overlay-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Login"
          >
            <div className="overlay-header">
              <h3>Login</h3>
              <button
                className="overlay-close"
                onClick={() => setLoginOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="overlay-body">
              <Field
                label="Username"
                value={loginForm.username}
                onChange={(v) =>
                  setLoginForm((p) => ({ ...p, username: v }))
                }
                required
              />
              <Field
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(v) =>
                  setLoginForm((p) => ({ ...p, password: v }))
                }
                required
              />
              {loginError && (
                <p className="overlay-error">✕ {loginError}</p>
              )}
            </div>

            <div className="overlay-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setLoginOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-submit" onClick={handleLogin}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Field component
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  hint,
  type = "text",
}: FieldProps) {
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      <input
        className="field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}