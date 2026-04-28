import { Link } from "react-router-dom";

const APPLETS = [
  {
    id: "key-to-key-signatures",
    title: "The Key to Key Signatures",
    description: "Practice identifying and understanding key signatures across all major and minor keys. (Work in progress)",
  }
];

export const MusicPracticePal = () => {
  return (
    <section className="page">
      <header className="hero">
        <p className="pill">Ongoing Project · Music education tools</p>
        <h1>Music Practice Pal</h1>
        <p className="subtitle">
          A collection of small, focused applets designed to make practicing core music skills more{" "}
          <span className="accent">interactive</span>, <span className="accent">visual</span>, and{" "}
          <span className="accent">ear-driven</span>.
        </p>
        <p className="subtitle">
          Each applet targets a specific concept so learners can{" "}
          build confidence one skill at a time.
        </p>
      </header>

      <section className="section">
        <h2>Explore the applets</h2>
        <p className="section-subtitle">
          More coming soon...
        </p>

        <div className="card-grid">
          {APPLETS.map((applet) => (
            <Link
              key={applet.id}
              to={`/portfolio/music-practice-pal/${applet.id}`}
              className="card card-link"
            >
              <h3>{applet.title}</h3>
              <p>{applet.description}</p>
              <span className="pill">Open applet</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
};

