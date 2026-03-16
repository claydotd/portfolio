import { Link } from "react-router-dom";

const APPLETS = [
  {
    id: "key-to-key-signatures",
    title: "The Key to Key Signatures",
    description: "Practice identifying and understanding key signatures across all major and minor keys.",
  },
  {
    id: "interval-inspector",
    title: "Interval Inspector",
    description: "Drill common intervals by ear and on the staff to strengthen your inner hearing.",
  },
  {
    id: "rhythm-workshop",
    title: "Rhythm Workshop",
    description: "Tap, count, and subdivide rhythms from simple meters to syncopated patterns.",
  },
  {
    id: "scale-builder",
    title: "Scale Builder",
    description: "Build scales step-by-step and connect them to fingerings and positions.",
  },
  {
    id: "chord-lab",
    title: "Chord Lab",
    description: "Experiment with triads and seventh chords to see how they sound and function.",
  },
  {
    id: "practice-planner",
    title: "Practice Planner",
    description: "Assemble focused practice routines using the other applets and your own goals.",
  },
];

export const MusicPracticePal = () => {
  return (
    <section className="page">
      <header className="hero">
        <p className="pill">Project · Music education tools</p>
        <h1>Music Practice Pal</h1>
        <p className="subtitle">
          A collection of small, focused applets designed to make practicing core music skills more{" "}
          <span className="accent">interactive</span>, <span className="accent">visual</span>, and{" "}
          <span className="accent">ear-driven</span>.
        </p>
        <p className="subtitle">
          Each applet targets a specific concept—like key signatures, intervals, or rhythm—so learners can{" "}
          build confidence one skill at a time.
        </p>
      </header>

      <section className="section">
        <h2>Explore the applets</h2>
        <p className="section-subtitle">
          Choose an applet to dive into a focused practice experience. You can mix and match them to build your own
          practice routine.
        </p>

        <div className="card-grid">
          {APPLETS.map((applet) => (
            <Link
              key={applet.id}
              to={`/music-practice-pal/${applet.id}`}
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

