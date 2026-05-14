import { useState } from "react";
import beansJson from "./beans.json";

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

const EMPTY_FORM = {
  roaster: "",
  name: "",
  origin: "",
  datePurchased: "",
  notes: "",
  greatOn: "",
};

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
  greatOn: string;
}

function beanToForm(bean: Bean): FormState {
  return {
    roaster: bean.roaster ?? "",
    name: bean.name ?? "",
    origin: bean.origin ?? "",
    datePurchased: bean.datePurchased ?? "",
    notes: Array.isArray(bean.notes) ? bean.notes.join(", ") : bean.notes ?? "",
    greatOn: Array.isArray(bean.greatOn)
      ? bean.greatOn.join(", ")
      : bean.greatOn ?? "",
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
    greatOn: form.greatOn
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export const BeanData = () => {
  const [beans, setBeans] = useState(beansJson.entries);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setOverlayOpen(true);
  };

  
  const openEdit = (bean: Bean) => {
    setEditingId(bean.id);
    setForm(beanToForm(bean));
    setErrors({});
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
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

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setBeans((prev) => {
      if (editingId !== null) {
        // Edit existing entry
        return prev.map((b) =>
          b.id === editingId ? formToBean(form, editingId) : b
        );
      }

      // Add or update by roaster+name match
      const match = prev.find(
        (b) =>
          b.roaster.toLowerCase() === form.roaster.trim().toLowerCase() &&
          b.name.toLowerCase() === form.name.trim().toLowerCase()
      );

      if (match) {
        return prev.map((b) =>
          b.id === match.id ? formToBean(form, match.id) : b
        );
      }

      const newId = prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
      return [...prev, formToBean(form, newId)];
    });

    closeOverlay();
  };

  const overlayTitle =
    editingId !== null
      ? "Edit Coffee Entry"
      : "Add New Coffee";

  const submitLabel =
    editingId !== null ? "Save Changes" : "Add Coffee";

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
            {BEAN_DATA_PLAN.map((beanDataPlan) => (
              <li key={beanDataPlan.id}>
                <span className="pill">{beanDataPlan.status}</span>
                <strong>{beanDataPlan.title}:</strong>{" "}
                {beanDataPlan.description}
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

        {/* Add button */}
        <div className="table-toolbar">
          <button className="btn btn-add" onClick={openAdd}>
            +
          </button>
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
              <th>Edit</th>
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
                <td>
                  <button
                    className="btn btn-edit"
                    onClick={() => openEdit(bean)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Overlay */}
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
                value={form.datePurchased}
                onChange={(v) => handleChange("datePurchased", v)}
                placeholder="e.g. 2024-03-15"
              />
              <Field
                label="Notes"
                value={form.notes}
                onChange={(v) => handleChange("notes", v)}
                placeholder="Comma-separated, e.g. chocolate, fruity, floral"
                hint="Separate multiple notes with commas."
              />
              <Field
                label="Great On"
                value={form.greatOn}
                onChange={(v) => handleChange("greatOn", v)}
                placeholder="Comma-separated, e.g. espresso, filter"
                hint="Separate multiple brew methods with commas."
              />

              {editingId === null && (
                <p className="overlay-hint">
                  If a coffee with the same roaster and name already exists,
                  its entry will be updated instead of creating a duplicate.
                </p>
              )}
            </div>

            <div className="overlay-footer">
              <button className="btn btn-cancel" onClick={closeOverlay}>
                Cancel
              </button>
              <button className="btn btn-submit" onClick={handleSubmit}>
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

function Field({ label, value, onChange, error, required, placeholder, hint }: FieldProps) {
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      <input
        className="field-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}