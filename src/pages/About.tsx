export const About = () => {
  return (
    <section className="page">
      <h1>About me</h1>
      <p className="section-subtitle">
        Use this page to tell your story: why you&apos;re learning to code, what you&apos;re interested in, and what
        kind of projects you want to build.
      </p>

      <div className="two-column">
        <div>
          <h2>Background</h2>
          <p>
            Replace this text with a short bio. You can mention your current role, studies, or what got you into
            programming.
          </p>
        </div>
        <div>
          <h2>Skills</h2>
          <ul className="pill-list">
            <li className="pill">HTML &amp; CSS</li>
            <li className="pill">JavaScript</li>
            <li className="pill">React</li>
            <li className="pill">TypeScript</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
