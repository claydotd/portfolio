import { useState, type FormEvent } from "react";

type ContactFormProps = {
  toEmail: string;
  onSubmitted?: () => void;
};

export const ContactForm = ({ toEmail, onSubmitted }: ContactFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const subject = `Project inquiry${name ? ` from ${name}` : ""}`;
    const body = `Name: ${name || "-"}\nEmail: ${email || "-"}\n\nMessage:\n${message || "-"}`;

    // Opens the user's email client with a pre-filled draft.
    window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;

    onSubmitted?.();
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          className="textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell me about your project..."
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn primary">
          Send message
        </button>
      </div>
    </form>
  );
};

