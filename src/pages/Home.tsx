export const Home = () => {
  return (
    <section className="page">
      <div className="hero">
        <p className="pill">Welcome to my portfolio</p>
        <h1>
          Hi, I&apos;m <span className="accent">Your Name</span>.
        </h1>
        <p className="subtitle">
          I&apos;m learning <span className="accent">web development</span> and this portfolio is where I experiment
          with React, TypeScript, and modern UI.
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
          <article className="card">
            <h3>Project One</h3>
            <p>A short description of something you built or are working on.</p>
          </article>
          <article className="card">
            <h3>Project Two</h3>
            <p>Another project. This can be a tutorial you followed or an experiment.</p>
          </article>
        </div>
      </section>

      <section id="contact" className="section">
        <h2>Contact</h2>
        <p className="section-subtitle">Add your email or links so people can reach you.</p>
        <div className="pill-row">
          <span className="pill">you@example.com</span>
          <span className="pill">@your_handle</span>
        </div>
      </section>
    </section>
  );
};
