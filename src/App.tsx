import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";

export const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/claydleslie.github.io/" element={<Home />} />
        <Route path="/claydleslie.github.io/about" element={<About />} />
      </Routes>
    </Layout>
  );
};
