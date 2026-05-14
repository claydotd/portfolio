import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bean {
  id: number;
  roaster: string;
  name: string;
  origin: string;
  datePurchased: string;
  notes: string[];
  greatOn: string[];
}

interface FormState {
  roaster: string;
  name: string;
  origin: string;
  datePurchased: string;
  notes: string;
  greatOn: string[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

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
    status: "in progress",
  },
  {
    id: 3,
    title: "Create a dashboard to visualise the data",
    description:
      "After that, I'll be creating an overview dashboard to visualise the data. This will include filtering and dynamically updating visuals.",
    status: "not started",
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
  datePurchased: "",
  notes: "",
  greatOn: [],
};

// ---------------------------------------------------------------------------
// Netlify DB config
// ---------------------------------------------------------------------------

// Your Netlify DB store name — change this to match what you created in the
// Netlify dashboard (or via `netlify db:create`).
const NETLIFY_DB_STORE = "production";

// Netlify DB REST base URL for the serverless function (no trailing slash).
// VITE_NETLIFY_DB_URL in Netlify env vars and local .env, e.g.:
//   VITE_NETLIFY_DB_URL=https://<your-site>.netlify.app/.netlify/functions/database
// The app calls this URL with ?store=…&list=true or ?store=…&key=bean-{id}.
const NETLIFY_DB_URL = import.meta.env.VITE_NETLIFY_DB_URL as string;

// ---------------------------------------------------------------------------
// Auth config (from Netlify environment variables)
// ---------------------------------------------------------------------------

// Set VITE_LOGIN_USERNAME and VITE_LOGIN_PASSWORD in your Netlify site's
// environment variables (Site settings → Environment variables).
// Also add them to a local .env file so `vite dev` works:
//   VITE_LOGIN_USERNAME=yourUsername
//   VITE_LOGIN_PASSWORD=yourPassword
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
    datePurchased: form.datePurchased.trim(),
    notes: form.notes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    greatOn: form.greatOn,
  };
}

// ---------------------------------------------------------------------------
// Netlify DB API helpers
// ---------------------------------------------------------------------------

/**
 * Fetches all beans from the Netlify DB store.
 * The store holds one key per bean, keyed by bean ID ("bean-{id}").
 */
async function fetchBeansFromNetlify(): Promise<Bean[]> {
  if (!NETLIFY_DB_URL) {
    throw new Error(
      "VITE_NETLIFY_DB_URL is not set. Add it to your Netlify environment variables."
    );
  }

  const listRes = await fetch(
    `${NETLIFY_DB_URL}?store=${encodeURIComponent(
      NETLIFY_DB_STORE
    )}&list=true`
  );
  if (!listRes.ok) {
    throw new Error(`Failed to list beans: ${listRes.status}`);
  }

  const { keys }: { keys: string[] } = await listRes.json();

  if (!keys || keys.length === 0) return [];

  // Fetch each bean in parallel
  const beans = await Promise.all(
    keys.map(async (key) => {
      const res = await fetch(
        `${NETLIFY_DB_URL}?store=${encodeURIComponent(
          NETLIFY_DB_STORE
        )}&key=${encodeURIComponent(key)}`
      );
      if (!res.ok) return null;
      const { value } = await res.json();
      return JSON.parse(value) as Bean;
    })
  );

  return (beans.filter(Boolean) as Bean[]).sort((a, b) => a.id - b.id);
}

/**
 * Upserts a single bean into the Netlify DB store.
 * Key format: "bean-{id}"
 */
async function saveBeanToNetlify(bean: Bean): Promise<void> {
  if (!NETLIFY_DB_URL) {
    throw new Error(
      "VITE_NETLIFY_DB_URL is not set. Add it to your Netlify environment variables."
    );
  }

  const key = `bean-${bean.id}`;
  const res = await fetch(
    `${NETLIFY_DB_URL}?store=${encodeURIComponent(
      NETLIFY_DB_STORE
    )}&key=${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(bean) }),
    }
  );

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
// Components
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

  // ---- submit (save to Netlify DB) ----------------------------------------

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
        // Editing an existing bean
        beanToSave = formToBean(form, editingId);
        setBeans((prev) =>
          prev.map((b) => (b.id === editingId ? beanToSave : b))
        );
      } else {
        // Check for a duplicate roaster + name
        const match = beans.find(
          (b) =>
            b.roaster.toLowerCase() === form.roaster.trim().toLowerCase() &&
            b.name.toLowerCase() === form.name.trim().toLowerCase()
        );

        if (match) {
          // Update the existing entry instead of creating a duplicate
          beanToSave = formToBean(form, match.id);
          setBeans((prev) =>
            prev.map((b) => (b.id === match.id ? beanToSave : b))
          );
        } else {
          // Brand-new entry — assign the next available ID
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

  // ---- derived labels -----------------------------------------------------

  const overlayTitle =
    editingId !== null ? "Edit Coffee Entry" : "Add New Coffee";

  const submitLabel = () => {
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "saved") return "Saved ✓";
    if (saveStatus === "error") return "Retry";
    return editingId !== null ? "Save Changes" : "Add Coffee";
  };

  // ---- render -------------------------------------------------------------

  return (
    <section className="page">
      <header className="hero">
        <p className="pill">BeanData · Coffee Bean Data Visualisation</p>
        <h1>Bean Data</h1>
        <p className="subtitle">
          This project is all about visualising data from my coffee bean
          purchases. I'm using this project to experiment with data
          visualisation.
        </p>
        <div>
          <p>The plan:</p>
          <ol>
            {BEAN_DATA_PLAN.map((item) => (
              <li key={item.id}>
                <span className="pill">{item.status}</span>
                <strong>{item.title}:</strong> {item.description}
              </li>
            ))}
          </ol>
        </div>
      </header>

      <section className="section">
        <h2>The database</h2>
        <p>
          I'm using Netlify DB to store the data. Here is a table with the
          contents of the database.
        </p>

        <div className="table-toolbar">
          <button className="btn btn-add" onClick={openAdd}>
            +
          </button>

          {!isAuthenticated ? (
            <button className="btn ghost" onClick={() => setLoginOpen(true)}>
              Login
            </button>
          ) : (
            <span className="pill">Spill the beans</span>
          )}
        </div>

        {/* Loading / error states */}
        {loadStatus === "loading" && (
          <p className="load-status">Loading beans…</p>
        )}
        {loadStatus === "error" && (
          <p className="overlay-error">✕ Failed to load beans: {loadError}</p>
        )}

        {loadStatus === "ready" && (
          <div className="bean-data-display">
            {/* Desktop table */}
            <div className="table-wrapper desktop-only">
              <table className="bean-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Roaster</th>
                    <th>Name</th>
                    <th>Origin</th>
                    <th>Date Purchased</th>
                    <th>Notes</th>
                    <th>Great On</th>
                    {isAuthenticated && <th>Edit</th>}
                  </tr>
                </thead>

                <tbody>
                  {beans.map((bean) => (
                    <tr key={bean.id}>
                      <td>{bean.id}</td>
                      <td>{bean.roaster}</td>
                      <td>{bean.name}</td>
                      <td>{bean.origin}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mobile-cards mobile-only">
              {beans.map((bean) => (
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
                    <span className="bean-card-label">Purchased</span>
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
                    <span className="bean-card-label">Great On</span>
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
              ))}
            </div>
          </div>
        )}
      </section>

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
                label="Date Purchased"
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
                <label className="field-label">Great On</label>
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
                  Which methods did you really like it as?
                </span>
              </div>

              {editingId === null && (
                <p className="overlay-hint">
                  If a coffee with the same roaster and name already exists, its
                  entry will be updated instead of creating a duplicate.
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