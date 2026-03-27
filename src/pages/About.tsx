import { useState } from "react";
import { ContactModal } from "../components/ContactModal";

export const About = () => {
  const CONTACT_EMAIL = "claydleslie@icloud.com";
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <section className="page">
      <h1>About me</h1>
      <p className="section-subtitle">
        Who am I? What am I doing here?
      </p>

      <div className="two-column">
        <div>
          <h2>The Beginning</h2>
          <p>
            I studied music, computer science, and environmental studies at the University of Victoria in Victoria, British Columbia, Canada. During my time at UVic, I began learning to code and fell in love with the process of building bite-sized digital tools.
          </p>
          <h2>Digital Media Academy</h2>
          <p>
            During my time at UVic, I started teaching at Digital Media Academy as a summer job. I began with primarily teaching Music Production courses, but later took on Mobile App Development, Game Development, 2D Animation, and Python coding courses. This is where I really began to appreciate and experiment with code.
          </p>
          <p>
            While teaching at Digital Media Academy, I learned just how much I enjoy the process of educating; Beginning with the foundational building blocks of computational thinking and building up to bigger and more complex projects is a beautiful process to see and support.
          </p>
          <h2>The BlueShift Years</h2>
          <p>
            After graduating with my Bachelor of Arts degree and moving to London, England, I started working at BlueShift Education, a non-for-profit after-school club provider dedicated to providing high-quality coding education to children of all ages. Initially in charge of teacher hiring, ongoing training and teacher management, I was able to take a step back from being on the front-line and use my coding skills to improve internal processes and make life easier in the office.
          </p>
          <p>
            Eventually, I was promoted to the Head of Education role and took on the development of new and bespoke course content. I was working with the building blocks once again, creating learning experiences for my teaching team to deliver, and creating bite-sized coding projects to help people learn.
          </p>
          <h2>Developing courses at Sololearn</h2>
          <p>
            In January 2024, I began my role as a curriculum developer at Sololearn. The bite-size format and global accessibility of the app is something I love. With my head fully in curriculum development, I was able to work with the foundational building blocks and create innovative ways of delivering the learning. During my time at Sololearn, I revamped coding courses, and created brand new courses to teach Data Literacy and AI skills.
          </p>
          <h2>The next chapter...</h2>
          <p>At the moment, I'm looking for what comes next. Whether it's in education, software development, staff training, or something else, I'm open to any opportunity where I can use my current skills and learn some new ones along the way.</p>
        </div>
        <div>
          <h2>Skills</h2>
          <ul className="pill-list">
            <li className="pill">HTML &amp; CSS</li>
            <li className="pill">JavaScript</li>
            <li className="pill">React</li>
            <li className="pill">TypeScript</li>
            <li className="pill">SQL</li>
            <li className="pill">Curriculum Development</li>
            <li className="pill">Educational Design</li>
            <li className="pill">Graphic Design</li>
          </ul>
          <div className="skills-cta">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setIsContactOpen(true);
              }}
            >
              Have a project for me? Get in touch
            </button>
          </div>
        </div>
      </div>
      <ContactModal
        isOpen={isContactOpen}
        toEmail={CONTACT_EMAIL}
        onClose={() => {
          setIsContactOpen(false);
        }}
      />
    </section>
  );
};
