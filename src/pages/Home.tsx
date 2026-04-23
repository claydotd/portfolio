import { useState } from "react";
import { Link } from "react-router-dom";
import { ContactModal } from "../components/ContactModal";

export const Home = () => {
  const CONTACT_EMAIL = "claydleslie@icloud.com";
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <section className="page">
      <div className="hero">
        <p className="pill">Welcome to my portfolio</p>
        <h1>
          Hi, I&apos;m <span className="accent">Clay</span>.
        </h1>
        <p className="subtitle">
          I&apos;m an <span className="accent">educational developer</span> and this portfolio is where I experiment
          with React, TypeScript, and modern UI practices.
        </p>
        <div className="hero-actions">
          <a href="#projects" className="btn primary">
            View projects
          </a>
          <a href="#contact" className="btn ghost">
            Contact me
          </a>
        </div>
      </div>

      <section id="projects" className="section">
        <h2>Featured projects</h2>
        <p className="section-subtitle">Start by adding a few projects you&apos;re proud of.</p>
        <div className="card-grid">
          <Link to="/weather-music" className="card card-link">
            <h3>Weather Music</h3>
            <p>
              A new applet that maps forecast conditions to musical ideas so practice feels connected to the day&apos;s
              atmosphere.
            </p>
            <span className="pill">Featured project</span>
          </Link>
          <Link to="/music-practice-pal" className="card card-link">
            <h3>Music Practice Pal</h3>
            <p>
              A set of tools for learning and practicing music rudiments created with{" "}
              <span className="accent">tone.js</span>.
            </p>
            <span className="pill">View project</span>
          </Link>
          <article className="card">
            <h3>Recipe Library</h3>
            <p>A user interface for managing recipes and shopping lists created with React and TypeScript.</p>
          </article>
        </div>
      </section>

      <section id="contact" className="section">
        <h2>Contact</h2>
        <p className="section-subtitle">I'm always looking for new opportunities to learn and grow. Get in touch!</p>
        <div className="contact-actions">
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn primary">
            Email
          </a>
          <a
            href="https://www.linkedin.com/in/claydotd"
            target="_blank"
            rel="noreferrer"
            className="btn ghost"
          >
            LinkedIn
          </a>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setIsContactOpen(true);
            }}
          >
            Contact form
          </button>
        </div>
        <ContactModal
          isOpen={isContactOpen}
          toEmail={CONTACT_EMAIL}
          onClose={() => {
            setIsContactOpen(false);
          }}
        />
      </section>
    </section>
  );
};
