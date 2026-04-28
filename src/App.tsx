import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { MusicPracticePal } from "./pages/MusicPracticePal";
import { WeatherMusic } from "./pages/WeatherMusic";
import { KeyToKeySignatures } from "./pages/applets/KeyToKeySignatures";
import { IntervalInspector } from "./pages/applets/IntervalInspector";
import { RhythmWorkshop } from "./pages/applets/RhythmWorkshop";
import { ScaleBuilder } from "./pages/applets/ScaleBuilder";
import { ChordLab } from "./pages/applets/ChordLab";
import { PracticePlanner } from "./pages/applets/PracticePlanner";

export const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/portfolio" element={<Home />} />
        <Route path="/portfolio/about" element={<About />} />
        <Route path="/portfolio/weather-music" element={<WeatherMusic />} />
        <Route path="/portfolio/music-practice-pal" element={<MusicPracticePal />} />
        <Route path="/portfolio/music-practice-pal/key-to-key-signatures" element={<KeyToKeySignatures />} />
        <Route path="/portfolio/music-practice-pal/interval-inspector" element={<IntervalInspector />} />
        <Route path="/portfolio/music-practice-pal/rhythm-workshop" element={<RhythmWorkshop />} />
        <Route path="/portfolio/music-practice-pal/scale-builder" element={<ScaleBuilder />} />
        <Route path="/portfolio/music-practice-pal/chord-lab" element={<ChordLab />} />
        <Route path="/portfolio/music-practice-pal/practice-planner" element={<PracticePlanner />} />
      </Routes>
    </Layout>
  );
};
