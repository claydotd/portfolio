import { useEffect } from "react";
import { ContactForm } from "./ContactForm";

type ContactModalProps = {
  isOpen: boolean;
  toEmail: string;
  onClose: () => void;
};

export const ContactModal = ({ isOpen, toEmail, onClose }: ContactModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        onMouseDown={(e) => {
          // Prevent backdrop click when interacting with the modal content.
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Contact</h2>
            <p className="modal-subtitle">Tell me about your project and I&apos;ll get back to you.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <ContactForm
          toEmail={toEmail}
          onSubmitted={() => {
            onClose();
          }}
        />
      </div>
    </div>
  );
};

