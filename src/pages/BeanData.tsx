import { useState } from "react";
import beansJson from "./beans.json";
import { GITHUB_CONFIG , LOGIN_CONFIG } from './secrets';

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
// Helpers
// ---------------------------------------------------------------------------

function beanToForm(bean: Bean): FormState {
  return {
    roaster: bean.roaster ?? "",
    name: bean.name ?? "",
    origin: bean.origin ?? "",
    datePurchased: bean.datePurchased ?? "",
    notes: Array.isArray(bean.notes) ? bean.notes.join(", ") : bean.notes ?? "",
    greatOn: Array.isArray(bean.greatOn)
      ? bean.greatOn
      : [],
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
// GitHub API
// ---------------------------------------------------------------------------

/**
 * Commits updated beans to GitHub by:
 *  1. Fetching the current file to get its SHA (required for updates).
 *  2. PUTting the new content with that SHA.
 *
 * Requires a fine-grained PAT with Contents: Read & Write on the target repo.
 */
async function commitBeansToGitHub(
  beans: Bean[],
): Promise<void> {
  const { owner, repo, path, token } = GITHUB_CONFIG;

  if (!owner || !repo || !path || !token) {
    throw new Error(
      "GitHub config is incomplete. Open Settings and fill in all fields."
    );
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Step 1: get current SHA
  const getRes = await fetch(apiBase, { headers });
  if (!getRes.ok) {
    const err = await getRes.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch current file from GitHub: ${getRes.status} ${
        (err as { message?: string }).message ?? ""
      }`
    );
  }
  const { sha } = (await getRes.json()) as { sha: string };

  // Step 2: encode new content
  const newContent = JSON.stringify({ entries: beans }, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(newContent)));

  // Step 3: commit
  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "chore: update beans.json via BeanData app",
      content: encoded,
      sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(
      `GitHub commit failed: ${putRes.status} ${
        (err as { message?: string }).message ?? ""
      }`
    );
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export const BeanData = () => {
  const [beans, setBeans] = useState<Bean[]>(beansJson.entries);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");

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
  
      setLoginForm({
        username: "",
        password: "",
      });
  
      return;
    }
  
    setLoginError("Invalid username or password.");
  };
  // ---- submit (save locally + commit to GitHub) ---------------------------

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    // Compute next beans state
    let nextBeans: Bean[];

    setBeans((prev) => {
      if (editingId !== null) {
        nextBeans = prev.map((b) =>
          b.id === editingId ? formToBean(form, editingId) : b
        );
        return nextBeans;
      }

      const match = prev.find(
        (b) =>
          b.roaster.toLowerCase() === form.roaster.trim().toLowerCase() &&
          b.name.toLowerCase() === form.name.trim().toLowerCase()
      );

      if (match) {
        nextBeans = prev.map((b) =>
          b.id === match.id ? formToBean(form, match.id) : b
        );
        return nextBeans;
      }

      const newId =
        prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
      nextBeans = [...prev, formToBean(form, newId)];
      return nextBeans;
    });

    // Commit to GitHub
    setSaveStatus("saving");
    setSaveError(null);

    try {
      // nextBeans is set synchronously above before the setState callback
      // resolves, so we recompute from current beans + the new entry here.
      const currentBeans = beans;
      let committed: Bean[];

      if (editingId !== null) {
        committed = currentBeans.map((b) =>
          b.id === editingId ? formToBean(form, editingId) : b
        );
      } else {
        const match = currentBeans.find(
          (b) =>
            b.roaster.toLowerCase() === form.roaster.trim().toLowerCase() &&
            b.name.toLowerCase() === form.name.trim().toLowerCase()
        );
        if (match) {
          committed = currentBeans.map((b) =>
            b.id === match.id ? formToBean(form, match.id) : b
          );
        } else {
          const newId =
            currentBeans.length > 0
              ? Math.max(...currentBeans.map((b) => b.id)) + 1
              : 1;
          committed = [...currentBeans, formToBean(form, newId)];
        }
      }

      await commitBeansToGitHub(committed);
      setSaveStatus("saved");

      // Close overlay after brief success flash
      setTimeout(() => {
        closeOverlay();
      }, 900);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // ---- derived labels -----------------------------------------------------

  const overlayTitle = editingId !== null ? "Edit Coffee Entry" : "Add New Coffee";

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
          I'm using a simple JSON file to store the data. Here is a table with
          the contents of the file.
        </p>

        <div className="table-toolbar">
          <button className="btn btn-add" onClick={openAdd}>
            +
          </button>

          {!isAuthenticated ? (
            <button
              className="btn ghost"
              onClick={() => setLoginOpen(true)}
            >
              Login
            </button>
          ) : (
            <span className="pill">Spill the beans</span>
          )}
        </div>

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
      </section>

      {/* ── Add / Edit overlay ───────────────────────────────────────────── */}
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
              <button className="overlay-close" onClick={closeOverlay} aria-label="Close">
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

{loginOpen && (
  <div
    className="overlay-backdrop"
    onClick={() => setLoginOpen(false)}
  >
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
            setLoginForm((p) => ({
              ...p,
              username: v,
            }))
          }
          required
        />

        <Field
          label="Password"
          type="password"
          value={loginForm.password}
          onChange={(v) =>
            setLoginForm((p) => ({
              ...p,
              password: v,
            }))
          }
          required
        />

        {loginError && (
          <p className="overlay-error">
            ✕ {loginError}
          </p>
        )}
      </div>

      <div className="overlay-footer">
        <button
          className="btn btn-cancel"
          onClick={() => setLoginOpen(false)}
        >
          Cancel
        </button>

        <button
          className="btn btn-submit"
          onClick={handleLogin}
        >
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