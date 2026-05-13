import beans from "./beans.json";

const BEAN_DATA_PLAN = [
  {
    id: 1,
    title: "Create a database of my coffee bean purchases",
    description:
      "I'll start by creating a database to store all the roasts purchased and their details.",
  },
  {
    id: 2,
    title: "Create an interface to add new purchases and add review notes",
    description:
      "Next, I want to dynamically add new roasts to the database and add review notes.",
  },
  {
    id: 3,
    title: "Create a dashboard to visualise the data",
    description:
      "After that, I'll be creating an overview dashboard to visualise the data. This will include filtering and dynamically updating visuals.",
  },
  {
    id: 4,
    title: "Add interactive visualisations",
    description:
      "Once everything else is working, I want to add some more creative and interactive ways of visualising the data.",
  },
  {
    id: 5,
    title: "Add a way to export the data",
    description:
      "At the end of the project, I want to add a way to export the data in a variety of formats so that others can access and use the data themselves.",
  },
];

export const BeanData = () => {
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

        <table className="bean-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Roaster</th>
              <th>Name</th>
              <th>Origin</th>
              <th>Date Purchased</th>
              <th>Notes</th>
              <th>Reviews</th>
            </tr>
          </thead>

          <tbody>
            {beans.entries.map((bean) => (
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
                    {bean.reviews.map((review, index) => (
                      <li key={index}>
                        {review.method}: {review.rating}/5
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
};