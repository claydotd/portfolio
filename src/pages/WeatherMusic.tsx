import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { weather_api_key } from './secrets';
import img1 from "./1.png";
import img2 from "./2.png";
import img3 from "./3.png";
import img4 from "./4.png";
import { getFallbackForecast } from "./Forecasts";

const images = [img1, img2, img3, img4];

type LocationOption = {
  id: string;
  name: string;
  countryName: string;
  lat: number;
  lon: number;
};

type ForecastDay = {
  dateLabel: string;
  weatherMain: string;
  weatherDescription: string;
  tempMin: number;
  tempMax: number;
  weatherIcon: string;
};

type ModeName = "ionian" | "aeolian" | "dorian" | "mixolydian";

type DrumTrack = "kick" | "snare" | "hihat" | "clap";

// Bass panel: 16 groups, each group has 4 steps.
// Each step stores a scale degree index (0–7, where 0 = root, 7 = octave up).
// The user picks ONE scale degree per group; all 4 steps in the group play that degree.
type BassGroup = {
  degree: number; // 0–7
  stepsOn: boolean[]; // length 4 — which of the 4 steps in this group are active
};

const DEFAULT_LOCATION: LocationOption = {
  id: "edinburgh-gb",
  name: "Edinburgh",
  countryName: "Scotland",
  lat: 55.9533,
  lon: -3.1883,
};

const LOCATION_OPTIONS: LocationOption[] = [
  DEFAULT_LOCATION,
  { id: "glasgow-gb", name: "Glasgow", countryName: "Scotland", lat: 55.8642, lon: -4.2518 },
  { id: "dundee-gb", name: "Dundee", countryName: "Scotland", lat: 56.462, lon: -2.9707 },
  { id: "aberdeen-gb", name: "Aberdeen", countryName: "Scotland", lat: 57.1497, lon: -2.0943 },
  { id: "inverness-gb", name: "Inverness", countryName: "Scotland", lat: 57.4778, lon: -4.2247 },
  { id: "stornoway-gb", name: "Stornoway", countryName: "Scotland", lat: 58.2093, lon: -6.3865 },
  { id: "benbecula-gb", name: "Benbecula", countryName: "Scotland", lat: 57.4698, lon: -7.3752 },
  { id: "portree-gb", name: "Portree", countryName: "Scotland", lat: 57.4125, lon: -6.1951 },
  { id: "kirkwall-gb", name: "Kirkwall", countryName: "Scotland", lat: 58.9847, lon: -2.9605 },
  { id: "lerwick-gb", name: "Lerwick", countryName: "Scotland", lat: 60.155, lon: -1.145 },
  { id: "london-gb", name: "London", countryName: "England", lat: 51.5072, lon: -0.1276 },
  { id: "dublin-ie", name: "Dublin", countryName: "Ireland", lat: 53.3498, lon: -6.2603 },
  { id: "paris-fr", name: "Paris", countryName: "France", lat: 48.8566, lon: 2.3522 },
  { id: "berlin-de", name: "Berlin", countryName: "Germany", lat: 52.52, lon: 13.405 },
  { id: "madrid-es", name: "Madrid", countryName: "Spain", lat: 40.4168, lon: -3.7038 },
  { id: "rome-it", name: "Rome", countryName: "Italy", lat: 41.9028, lon: 12.4964 },
  { id: "new-york-us", name: "New York", countryName: "United States", lat: 40.7128, lon: -74.006 },
  { id: "nashville-us", name: "Nashville", countryName: "United States", lat: 36.1627, lon: -86.7816 },
  { id: "toronto-ca", name: "Toronto", countryName: "Canada", lat: 43.6532, lon: -79.3832 },
  { id: "vancouver-ca", name: "Vancouver", countryName: "Canada", lat: 49.2462, lon: -123.1162 },
  { id: "sao-paulo-br", name: "Sao Paulo", countryName: "Brazil", lat: -23.5558, lon: -46.6396 },
  { id: "buenos-aires-ar", name: "Buenos Aires", countryName: "Argentina", lat: -34.6037, lon: -58.3816 },
  { id: "lagos-ng", name: "Lagos", countryName: "Nigeria", lat: 6.5244, lon: 3.3792 },
  { id: "cape-town-za", name: "Cape Town", countryName: "South Africa", lat: -33.9249, lon: 18.4241 },
  { id: "tokyo-jp", name: "Tokyo", countryName: "Japan", lat: 35.6762, lon: 139.6503 },
  { id: "seoul-kr", name: "Seoul", countryName: "South Korea", lat: 37.5665, lon: 126.978 },
  { id: "mumbai-in", name: "Mumbai", countryName: "India", lat: 19.076, lon: 72.8777 },
  { id: "dubai-ae", name: "Dubai", countryName: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { id: "sydney-au", name: "Sydney", countryName: "Australia", lat: -33.8688, lon: 151.2093 },
  { id: "auckland-nz", name: "Auckland", countryName: "New Zealand", lat: -36.8509, lon: 174.7645 },
  { id: "mcmurdo-aq", name: "McMurdo Station", countryName: "Antarctica", lat: -77.8419, lon: 166.6863 },
];

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius km
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findNearestLocation = (lat: number, lon: number): LocationOption => {
  let best = LOCATION_OPTIONS[0];
  let bestDist = Infinity;

  for (const loc of LOCATION_OPTIONS) {
    const d = getDistanceKm(lat, lon, loc.lat, loc.lon);
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }

  return best;
};

const formatLocationLabel = (location: LocationOption) =>
  location.countryName ? `${location.name}, ${location.countryName}` : location.name;

const mapWeatherToScaleDegree = (condition: string): number => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder")) return 6;
  if (normalized.includes("rain") || normalized.includes("drizzle")) return 5;
  if (normalized.includes("snow")) return 2;
  if (normalized.includes("cloud")) return 4;
  if (normalized.includes("mist") || normalized.includes("fog")) return 1;
  if (normalized.includes("clear")) return 0;
  return 3;
};

const tempMinToNoteLength = (tempMin: number): string => {
  const clamped = Math.max(-10, Math.min(15, tempMin));
  const t = 1 - (clamped + 10) / 25; // cold → 1, warm → 0

  if (t > 0.75) return "1n";   // very cold → very long
  if (t > 0.5)  return "2n";
  if (t > 0.25) return "4n";
  return "8n";                 // warm → short
};

const tempMaxToVelocity = (tempMax: number): number => {
  const clamped = Math.max(-10, Math.min(40, tempMax));
  return 0.3 + ((clamped + 10) / 50) * 0.7; // 0.3 → 1.0
};

const toDateLabel = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const MODE_INTERVALS: Record<ModeName, number[]> = {
  ionian:     [0, 2, 4, 5, 7, 9, 11],
  aeolian:    [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const MODE_LABELS: Record<ModeName, string> = {
  ionian:     "Ionian (Major)",
  aeolian:    "Aeolian (Natural Minor)",
  dorian:     "Dorian",
  mixolydian: "Mixolydian",
};

// Chromatic root notes — semitone offset from C
const ROOT_NOTES: { label: string; semitones: number }[] = [
  { label: "C",  semitones: 0  },
  { label: "C♯/D♭", semitones: 1  },
  { label: "D",  semitones: 2  },
  { label: "D♯/E♭", semitones: 3  },
  { label: "E",  semitones: 4  },
  { label: "F",  semitones: 5  },
  { label: "F♯/G♭", semitones: 6  },
  { label: "G",  semitones: 7  },
  { label: "G♯/A♭", semitones: 8  },
  { label: "A",  semitones: 9  },
  { label: "A♯/B♭", semitones: 10 },
  { label: "B",  semitones: 11 },
];

// Scale degree display labels
const DEGREE_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8ve"];

const weatherIconForCondition = (condition: string): string => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder")) return "⛈️";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "🌧️";
  if (normalized.includes("snow")) return "❄️";
  if (normalized.includes("mist") || normalized.includes("fog")) return "🌫️";
  if (normalized.includes("cloud")) return "☁️";
  if (normalized.includes("clear")) return "☀️";
  return "🌤️";
};

const DRUM_TRACKS: { id: DrumTrack; label: string; emoji: string }[] = [
  { id: "kick",  label: "Kick",   emoji: "🟣" },
  { id: "snare", label: "Snare",  emoji: "🔵" },
  { id: "hihat", label: "Hi-Hat", emoji: "🟡" },
  { id: "clap",  label: "Clap",   emoji: "🟠" },
];

const DEFAULT_DRUM_PATTERN: Record<DrumTrack, boolean[]> = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
  hihat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
  clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,0].map(Boolean),
};

// Default bass: 16 groups, each with degree 0 (root),
const DEFAULT_BASS_GROUPS: BassGroup[] = Array.from({ length: 16 }, (_, i) => ({
  degree: i % 4 === 0 ? 0 : (i % 4 === 2 ? 4 : 0), // slight variation
  stepsOn: [true, true, true, true],
}));

const OPENWEATHER_API_KEY = weather_api_key;
const OPENWEATHER_DAILY_ENDPOINT = "https://api.openweathermap.org/data/2.5/forecast/daily";
const FORECAST_STEP_COUNT = 16;
const FETCH_TIMEOUT_MS = 12000;

type OpenWeatherDailyResponse = {
  cod?: string;
  message?: string | number;
  list?: Array<{
    dt: number;
    temp: { min: number; max: number };
    weather: Array<{ main: string; description: string }>;
  }>;
};

const parseForecastDays = (data: OpenWeatherDailyResponse): ForecastDay[] => {
  const normalizedDays: ForecastDay[] =
    data.list?.slice(0, FORECAST_STEP_COUNT).map((day) => ({
      dateLabel: toDateLabel(day.dt),
      weatherMain: day.weather[0]?.main ?? "Unknown",
      weatherDescription: day.weather[0]?.description ?? "n/a",
      tempMin: day.temp.min,
      tempMax: day.temp.max,
      weatherIcon: weatherIconForCondition(day.weather[0]?.main ?? ""),
    })) ?? [];

  if (normalizedDays.length === 0) throw new Error("No forecast data returned.");

  return [
    ...normalizedDays,
    ...Array.from({ length: Math.max(0, FORECAST_STEP_COUNT - normalizedDays.length) }, (_, index) => ({
      dateLabel: `Day ${normalizedDays.length + index + 1}`,
      weatherMain: normalizedDays[normalizedDays.length - 1]?.weatherMain ?? "Unknown",
      weatherDescription: normalizedDays[normalizedDays.length - 1]?.weatherDescription ?? "n/a",
      tempMin: normalizedDays[normalizedDays.length - 1]?.tempMin ?? 0,
      tempMax: normalizedDays[normalizedDays.length - 1]?.tempMax ?? 0,
      weatherIcon: normalizedDays[normalizedDays.length - 1]?.weatherIcon ?? "❔",
    })),
  ].slice(0, FORECAST_STEP_COUNT);
};

// ── Weather → synth parameter helpers ───────────────────────────────────────

const tempToFilterCutoff = (tempMax: number): number => {
  const clamped = Math.max(-10, Math.min(40, tempMax));
  const t = (clamped + 10) / 50;
  return Math.round(100 + t * t * 3900);
};

const tempToRelease = (tempMin: number): number => {
  const clamped = Math.max(-10, Math.min(15, tempMin));
  const t = 1 - (clamped + 10) / 25;
  return parseFloat((0.2 + t * 1.0).toFixed(2));
};

const descriptionToDistortion = (description: string): number => {
  const d = description.toLowerCase();
  if (d.includes("thunder") || d.includes("storm"))    return 0.55;
  if (d.includes("heavy"))                              return 0.40;
  if (d.includes("moderate") || d.includes("drizzle")) return 0.25;
  if (d.includes("light") || d.includes("overcast"))   return 0.10;
  if (d.includes("clear") || d.includes("few"))        return 0.0;
  return 0.15;
};

// ── Derive MIDI note from scale degree + mode + root + base octave ──────────
const degreeToNote = (degree: number, mode: ModeName, octave: number, rootSemitones = 0): string => {
  const intervals = MODE_INTERVALS[mode];
  // degree 7 = octave above root
  const interval = degree >= 7 ? 12 : (intervals[degree] ?? 0);
  const midi = 36 + rootSemitones + interval + (octave - 3) * 12; // base C2=36
  return Tone.Frequency(midi, "midi").toNote();
};

export const WeatherMusic = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(DEFAULT_LOCATION);
  const [locationSearch, setLocationSearch] = useState(formatLocationLabel(DEFAULT_LOCATION));
  const [forecast, setForecast] = useState<ForecastDay[]>(getFallbackForecast(DEFAULT_LOCATION.id));
  const [stepsOn, setStepsOn] = useState<boolean[]>(Array.from({ length: 16 }, (_, i) => i % 4 === 0));
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(96);
  const [selectedMode, setSelectedMode] = useState<ModeName>("ionian");
  const [selectedRoot, setSelectedRoot] = useState(0); // semitone offset; 0 = C
  const [statusMessage, setStatusMessage] = useState("Loading forecast...");
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [highlightedLocationIndex, setHighlightedLocationIndex] = useState(-1);
  const [reloadCount, setReloadCount] = useState(0);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [animFrame, setAnimFrame] = useState(0);

  // Drum state
  const [drumPattern, setDrumPattern] = useState<Record<DrumTrack, boolean[]>>(DEFAULT_DRUM_PATTERN);
  const [drumsEnabled, setDrumsEnabled] = useState(false);
  const [drumGridOpen, setDrumGridOpen] = useState(false);

  // Bass state
  const [bassGroups, setBassGroups] = useState<BassGroup[]>(DEFAULT_BASS_GROUPS);
  const [bassEnabled, setBassEnabled] = useState(false);
  const [bassGridOpen, setBassGridOpen] = useState(false);
  // activeBassStep tracks which of the 64 bass steps is currently active
  const [activeBassStep, setActiveBassStep] = useState<number | null>(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  // Polyphonic 80s melody synth
  const polySynthRef = useRef<Tone.PolySynth | null>(null);
  const polyChorusRef = useRef<Tone.Chorus | null>(null);
  const polyReverbRef = useRef<Tone.Reverb | null>(null);
  const polyFilterRef = useRef<Tone.Filter | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);

  const locationComboboxRef = useRef<HTMLDivElement | null>(null);

  // Drum refs
  const drumSynthsRef = useRef<Record<string, Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth> | null>(null);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);

  // Bass refs
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const bassSequenceRef = useRef<Tone.Sequence<number> | null>(null);

  const filteredLocations = useMemo(() => {
    if (showAllLocations) return LOCATION_OPTIONS;
    const query = locationSearch.trim().toLowerCase();
    if (!query) return LOCATION_OPTIONS;
    return LOCATION_OPTIONS.filter((loc) => formatLocationLabel(loc).toLowerCase().includes(query));
  }, [locationSearch, showAllLocations]);

  useEffect(() => {
    if (!isLocationMenuOpen) { setHighlightedLocationIndex(-1); return; }
    if (filteredLocations.length === 0) { setHighlightedLocationIndex(-1); return; }
    setHighlightedLocationIndex((prev) => (prev < 0 || prev >= filteredLocations.length) ? 0 : prev);
  }, [filteredLocations, isLocationMenuOpen]);

  const weatherDrivenPitches = useMemo(
    () =>
      forecast.map((day) => {
        const mode = MODE_INTERVALS[selectedMode];
        const degree = mapWeatherToScaleDegree(day.weatherMain);
        const interval = mode[degree] ?? mode[0];
        return Tone.Frequency(60 + selectedRoot + interval, "midi").toNote(); // C4 base + root offset
      }).slice(0, 16),
    [forecast, selectedMode, selectedRoot]
  );

  // ── 80s Polyphonic melody synth setup (runs once) ───────────────────────────
  useEffect(() => {
    // Classic 80s poly synth: sawtooth + slight detuned second osc, slow attack, long release
    polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.06,
        decay: 0.4,
        sustain: 0.65,
        release: 2.8,    // Long ring-out — notes sustain and overlap
      },
      volume: -12,
    });

    // Stereo chorus for extra 80's vibes
    polyChorusRef.current = new Tone.Chorus({
      frequency: 2.8,
      delayTime: 3.5,
      depth: 0.2,
      wet: 0.6,
    }).start();

    // Reverb
    polyReverbRef.current = new Tone.Reverb({ decay: 4.0, wet: 0.35 });

    // Gentle high-pass to keep synth from muddying the bass
    polyFilterRef.current = new Tone.Filter({ type: "highpass", frequency: 180, rolloff: -12 });

    // Chain: polySynth → chorus → reverb → highpass → destination
    polySynthRef.current.connect(polyChorusRef.current);
    polyChorusRef.current.connect(polyReverbRef.current);
    polyReverbRef.current.connect(polyFilterRef.current);
    polyFilterRef.current.toDestination();

    Tone.Transport.bpm.value = bpm;

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        setAnimFrame(Math.floor(stepIndex / 4));
      },
      Array.from({ length: 16 }, (_, i) => i),
      "16n"
    );

    return () => {
      sequenceRef.current?.stop();
      sequenceRef.current?.dispose();
      sequenceRef.current = null;
      polySynthRef.current?.dispose();
      polySynthRef.current = null;
      polyChorusRef.current?.dispose();
      polyChorusRef.current = null;
      polyReverbRef.current?.dispose();
      polyReverbRef.current = null;
      polyFilterRef.current?.dispose();
      polyFilterRef.current = null;
      void Tone.Transport.stop();
      Tone.Transport.cancel(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drum synth setup (runs once) ────────────────────────────────────────────
  useEffect(() => {
    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 4,
      envelope: {
        attack: 0.02,
        decay: 0.6,
        sustain: 0,
        release: 0.3,
      },
      volume: -6,
    });

    const snareSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 0,
        release: 0.2,
      },
      volume: -8,
    });

    const hihatSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.01,
        decay: 0.12,
        release: 0.08,
      },
      harmonicity: 3,
      modulationIndex: 10,
      resonance: 2000,
      octaves: 1,
      volume: -18,
    });

    const clapSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0,
        release: 0.25,
      },
      volume: -10,
    });

    const clapReverb = new Tone.Reverb({ decay: 1.2, wet: 0.45 }).toDestination();
    clapSynth.connect(clapReverb);

    const drumReverb = new Tone.Reverb({
      decay: 3.5,
      wet: 0.6,
    }).toDestination();
    
    const drumFilter = new Tone.Filter({
      type: "lowpass",
      frequency: 1200,
    }).connect(drumReverb);

    drumSynthsRef.current = { kick: kickSynth, snare: snareSynth, hihat: hihatSynth, clap: clapSynth };
    const drumChorus = new Tone.Chorus({
      frequency: 0.3,
      delayTime: 8,
      depth: 0.4,
      wet: 0.5,
    }).start();
    
    drumFilter.connect(drumChorus);
    drumChorus.connect(drumReverb);
    kickSynth.connect(drumFilter);
    snareSynth.connect(drumFilter);
    hihatSynth.connect(drumFilter);
    clapSynth.connect(drumFilter);

    return () => {
      drumSequenceRef.current?.stop();
      drumSequenceRef.current?.dispose();
      drumSequenceRef.current = null;
      kickSynth.dispose(); snareSynth.dispose(); hihatSynth.dispose();
      clapSynth.dispose(); clapReverb.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bass synth setup (runs once) ────────────────────────────────────────────
  useEffect(() => {
    // Punchy analogue bass: sine-triangle blend, tight envelope
    bassSynthRef.current = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { type: "lowpass", rolloff: -24, Q: 2 },
      envelope: { attack: 0.008, decay: 0.05, sustain: 0.8, release: 0.95 },
      filterEnvelope: {
        attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.35,
        baseFrequency: 60, octaves: 3.5,
      },
      volume: -2,
    }).toDestination();

    return () => {
      bassSequenceRef.current?.stop();
      bassSequenceRef.current?.dispose();
      bassSequenceRef.current = null;
      bassSynthRef.current?.dispose();
      bassSynthRef.current = null;
    };
  }, []);

  // ── Melody sequence rebuild ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sequenceRef.current) return;
    sequenceRef.current.dispose();

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        setAnimFrame(Math.floor(stepIndex / 4));
        if (!stepsOn[stepIndex]) return;

        const day = forecast[stepIndex];
        const pitch = weatherDrivenPitches[stepIndex] ?? "C4";
        const poly = polySynthRef.current;

        if (poly && day) {
          const release = 1.5 + tempToRelease(day.tempMin) * 1.2;
          poly.set({ envelope: { release } });
        
          const duration = tempMinToNoteLength(day.tempMin);
          const velocity = tempMaxToVelocity(day.tempMax);
        
          poly.triggerAttackRelease(pitch, duration, time, velocity);
        }
      },
      Array.from({ length: 16 }, (_, i) => i),
      "16n"
    );

    if (isPlaying) sequenceRef.current.start(0);
  }, [isPlaying, stepsOn, weatherDrivenPitches, forecast]);

  // ── Drum sequence rebuild ────────────────────────────────────────────────────
  useEffect(() => {
    const synths = drumSynthsRef.current;
    if (!synths) return;
    drumSequenceRef.current?.dispose();

    drumSequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        if (!drumsEnabled) return;
        (Object.keys(drumPattern) as DrumTrack[]).forEach((track) => {
          if (!drumPattern[track][stepIndex]) return;
          const synth = synths[track];
          if (track === "kick")  (synth as Tone.MembraneSynth).triggerAttackRelease("C1", "16n", time);
          else if (track === "snare" || track === "clap") (synth as Tone.NoiseSynth).triggerAttackRelease("16n", time);
          else if (track === "hihat") (synth as Tone.MetalSynth).triggerAttackRelease("16n", time);
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      "16n"
    );

    if (isPlaying) drumSequenceRef.current.start(0);
  }, [isPlaying, drumsEnabled, drumPattern]);

  // ── Bass sequence rebuild  ─────────────────────
  useEffect(() => {
    const synth = bassSynthRef.current;
    if (!synth) return;
    bassSequenceRef.current?.dispose();

    // Flatten 16 groups × 4 steps into 64-step array
    const steps64 = Array.from({ length: 64 }, (_, i) => i);

    bassSequenceRef.current = new Tone.Sequence(
      (time, flatStep) => {
        setActiveBassStep(flatStep);
        if (!bassEnabled) return;

        const groupIndex = Math.floor(flatStep / 4);
        const stepInGroup = flatStep % 4;
        const group = bassGroups[groupIndex];
        if (!group || !group.stepsOn[stepInGroup]) return;

        const note = degreeToNote(group.degree, selectedMode, 2, selectedRoot); // Octave 2 for bass
        synth.triggerAttackRelease(note, "16n", time);
      },
      steps64,
      "16n"
    );

    if (isPlaying) bassSequenceRef.current.start(0);
  }, [isPlaying, bassEnabled, bassGroups, selectedMode]);

  // ── BPM sync ────────────────────────────────────────────────────────────────
  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.08);
  }, [bpm]);

  // ── Weather fetch ────────────────────────────────────────────────────────────
  const fetchForecast = useCallback(async () => {
    setIsFetchingWeather(true);
    setStatusMessage(`Loading forecast for ${formatLocationLabel(selectedLocation)}...`);
    try {
      const params = new URLSearchParams({
        lat: String(selectedLocation.lat),
        lon: String(selectedLocation.lon),
        cnt: String(FORECAST_STEP_COUNT),
        units: "metric",
        appid: OPENWEATHER_API_KEY,
      });
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(`${OPENWEATHER_DAILY_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
      window.clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Forecast request failed (${response.status})`);
      const data = (await response.json()) as OpenWeatherDailyResponse;
      if (data.cod && data.cod !== "200") throw new Error(`OpenWeather error: ${String(data.message ?? data.cod)}`);
      setForecast(parseForecastDays(data));
      setStatusMessage(`Loaded 16-day forecast for ${formatLocationLabel(selectedLocation)}.`);
    } catch (error) {
      console.error(error);
      setForecast(getFallbackForecast(selectedLocation.id));const nearest = findNearestLocation(
        selectedLocation.lat,
        selectedLocation.lon
      );
      
      // Update location to the nearest known one
      setSelectedLocation(nearest);
      setLocationSearch(formatLocationLabel(nearest));
      
      // Use its fallback forecast
      setForecast(getFallbackForecast(nearest.id));
      
      const isKnownLocation = LOCATION_OPTIONS.some(
        (loc) => loc.id === selectedLocation.id
      );
      
      if (!isKnownLocation) {
        const nearest = findNearestLocation(
          selectedLocation.lat,
          selectedLocation.lon
        );
      
        setSelectedLocation(nearest);
        setLocationSearch(formatLocationLabel(nearest));
        setForecast(getFallbackForecast(nearest.id));
      } else {
        setForecast(getFallbackForecast(selectedLocation.id));
      }
      if (error instanceof Error && error.name === "AbortError") {
        setStatusMessage("Weather request timed out. Showing example Scottish spring forecast.");
      } else {
        setStatusMessage(`Could not load live forecast. Showing example forecast for ${formatLocationLabel(selectedLocation)}.`);
      }
    } finally {
      setIsFetchingWeather(false);
    }
  }, [selectedLocation]);

  useEffect(() => { void fetchForecast(); }, [fetchForecast, reloadCount]);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setSelectedLocation({ id: "user-location", name: "Your Location", countryName: "", lat: latitude, lon: longitude });
        setLocationSearch("Your Location");
      },
      () => {
        setSelectedLocation(DEFAULT_LOCATION);
        setLocationSearch(formatLocationLabel(DEFAULT_LOCATION));
      }
    );
  }, []);

  // ── Close location menu on outside click ─────────────────────────────────────
  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      if (!locationComboboxRef.current?.contains(event.target as Node)) setIsLocationMenuOpen(false);
    };
    window.addEventListener("mousedown", onDocumentPointerDown);
    return () => window.removeEventListener("mousedown", onDocumentPointerDown);
  }, []);

  // ── Playback toggle ──────────────────────────────────────────────────────────
  const onTogglePlay = async () => {
    if (!sequenceRef.current) return;
    if (!isPlaying) {
      await Tone.start();
      sequenceRef.current.start(0);
      drumSequenceRef.current?.start(0);
      bassSequenceRef.current?.start(0);
      await Tone.Transport.start();
      setIsPlaying(true);
      return;
    }
    sequenceRef.current.stop();
    drumSequenceRef.current?.stop();
    bassSequenceRef.current?.stop();
    await Tone.Transport.stop();
    setIsPlaying(false);
    setActiveStep(null);
    setActiveBassStep(null);
  };

  const selectLocation = (location: LocationOption) => {
    setSelectedLocation(location);
    setLocationSearch(formatLocationLabel(location));
    setShowAllLocations(false);
    setIsLocationMenuOpen(false);
    setHighlightedLocationIndex(-1);
  };

  return (
    <section className="page">
      <header className="hero">
        <p className="pill">Project · Weather-driven step sequencer</p>
        <h1>Weather Music</h1>
        <p className="subtitle">
          A 16-step sequencer where the sound and note for each step is set by one day of weather data. Use your location or choose a location, then see what the forecast sounds like!
        </p>
      </header>

      <section className="section weather-music-panel">
        <div className="sequencer-animation">
          <img src={images[animFrame % 4]} alt="sequencer animation" className="sequencer-animation-image" />
        </div>

        <div className="weather-music-toolbar">
          {/* Location picker */}
          <label className="form-field weather-location-picker">
            <span>Location</span>
            <div className="weather-location-combobox" ref={locationComboboxRef}>
              <input
                className="input"
                value={locationSearch}
                onChange={(e) => { setLocationSearch(e.target.value); setShowAllLocations(false); setIsLocationMenuOpen(true); }}
                onFocus={() => setIsLocationMenuOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (!isLocationMenuOpen) { setIsLocationMenuOpen(true); return; }
                    setHighlightedLocationIndex((prev) => filteredLocations.length === 0 ? -1 : Math.min(prev + 1, filteredLocations.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (!isLocationMenuOpen) { setIsLocationMenuOpen(true); return; }
                    setHighlightedLocationIndex((prev) => filteredLocations.length === 0 ? -1 : Math.max(prev - 1, 0));
                  } else if (e.key === "Enter") {
                    if (isLocationMenuOpen && highlightedLocationIndex >= 0 && filteredLocations[highlightedLocationIndex]) {
                      e.preventDefault();
                      selectLocation(filteredLocations[highlightedLocationIndex]);
                    }
                  } else if (e.key === "Escape") {
                    if (isLocationMenuOpen) { e.preventDefault(); setIsLocationMenuOpen(false); setHighlightedLocationIndex(-1); }
                  }
                }}
                placeholder="Type to filter locations..."
                aria-label="Search location"
                role="combobox"
                aria-expanded={isLocationMenuOpen}
                aria-controls="weather-location-menu"
                aria-activedescendant={highlightedLocationIndex >= 0 ? `weather-location-option-${filteredLocations[highlightedLocationIndex]?.id}` : undefined}
              />
              <button
                type="button" className="weather-location-toggle"
                aria-label="Toggle location options" aria-expanded={isLocationMenuOpen}
                onClick={() => { setIsLocationMenuOpen((p) => !p); setShowAllLocations(true); }}
              >▾</button>
              {isLocationMenuOpen && (
                <ul className="weather-location-menu" id="weather-location-menu" role="listbox">
                  {filteredLocations.map((loc, index) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        id={`weather-location-option-${loc.id}`}
                        className={`weather-location-option ${highlightedLocationIndex === index ? "highlighted" : ""}`}
                        role="option" aria-selected={highlightedLocationIndex === index}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHighlightedLocationIndex(index)}
                        onClick={() => selectLocation(loc)}
                      >{formatLocationLabel(loc)}</button>
                    </li>
                  ))}
                  {filteredLocations.length === 0 && <li className="weather-location-empty">No matching locations</li>}
                </ul>
              )}
            </div>
          </label>

          {/* BPM */}
          <label className="form-field weather-bpm-control">
            <span>Tempo ({bpm} BPM)</span>
            <input type="range" min={60} max={160} step={1} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          {/* Root + Mode selectors stacked */}
          <div className="weather-scale-controls">
            <label className="form-field weather-root-control">
              <span>Root Note</span>
              <select
                className="input weather-root-select"
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(Number(e.target.value))}
              >
                {ROOT_NOTES.map((note) => (
                  <option key={note.semitones} value={note.semitones}>
                    {note.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field weather-mode-control">
              <span>Mode</span>
              <select
                className="input weather-mode-select"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as ModeName)}
              >
                {Object.entries(MODE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Stacked drum + bass pills */}
          <div className="instrument-pill-stack">
            <div className="drum-pill">
              <button type="button" className={`btn drum-pill-drum ${drumsEnabled ? "primary" : "ghost"}`}
                title={drumsEnabled ? "Mute drums" : "Unmute drums"}
                onClick={() => setDrumsEnabled((v) => !v)} aria-pressed={drumsEnabled}>🥁</button>
              <button type="button" className={`btn drum-pill-grid ${drumGridOpen ? "primary" : "ghost"}`}
                title="Edit drum pattern" onClick={() => setDrumGridOpen((v) => !v)} aria-pressed={drumGridOpen}>⊞</button>
            </div>
            <div className="drum-pill">
              <button type="button" className={`btn drum-pill-drum ${bassEnabled ? "primary" : "ghost"}`}
                title={bassEnabled ? "Mute bass" : "Unmute bass"}
                onClick={() => setBassEnabled((v) => !v)} aria-pressed={bassEnabled}>🎸</button>
              <button type="button" className={`btn drum-pill-grid ${bassGridOpen ? "primary" : "ghost"}`}
                title="Edit bass pattern" onClick={() => setBassGridOpen((v) => !v)} aria-pressed={bassGridOpen}>⊞</button>
            </div>
          </div>

          <button type="button" className={`btn ${isPlaying ? "ghost" : "primary"}`} onClick={() => void onTogglePlay()}>
            {isPlaying ? "Stop sequencer" : "Start sequencer"}
          </button>
          <button type="button" className="btn ghost"
            onClick={() => setReloadCount((v) => v + 1)} disabled={isFetchingWeather}>
            {isFetchingWeather ? "Reloading..." : "Reload weather"}
          </button>
        </div>

        <p className="section-subtitle">{statusMessage}</p>

        {/* Weather sequencer grid */}
        <div className="weather-sequencer-grid">
          {forecast.slice(0, 16).map((day, index) => {
            const isStepOn = stepsOn[index];
            const isStepActive = activeStep === index;
            return (
              <button
                key={`${day.dateLabel}-${index}`} type="button"
                className={`weather-step ${isStepOn ? "on" : "off"} ${isStepActive ? "active" : ""}`}
                onClick={() => setStepsOn((prev) => prev.map((v, i) => i === index ? !v : v))}
              >
                <span className="weather-step-day">{day.dateLabel}</span>
                <span className="weather-step-icon" aria-hidden="true">{day.weatherIcon}</span>
                <span className="weather-step-main">{day.weatherMain}</span>
                <span className="weather-step-temp">{Math.round(day.tempMax)} / {Math.round(day.tempMin)} C</span>
                <span className="weather-step-detail">{day.weatherDescription}</span>
                <span className="weather-step-pitch">{weatherDrivenPitches[index] ?? "C4"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Drum grid overlay ───────────────────────────────────────────────── */}
      {drumGridOpen && (
        <div className="drum-overlay" role="dialog" aria-label="Drum sequencer">
          <div className="drum-overlay-inner">
            <div className="drum-overlay-header">
              <h2 className="drum-overlay-title">
                🥁 Drum Machine
                <span className="drum-overlay-subtitle">vaporwave edition</span>
              </h2>
              <div className="drum-overlay-controls">
                <button type="button" className={`btn ${drumsEnabled ? "primary" : "ghost"}`} onClick={() => setDrumsEnabled((v) => !v)}>
                  {drumsEnabled ? "Mute" : "Unmute"}
                </button>
                <button type="button" className="btn ghost" onClick={() => setDrumPattern(DEFAULT_DRUM_PATTERN)}>Reset</button>
                <button type="button" className="btn ghost" onClick={() => setDrumGridOpen(false)} aria-label="Close drum sequencer">✕</button>
              </div>
            </div>

            <div className="drum-grid">
              <div className="drum-row drum-row-header">
                <span className="drum-track-label" />
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className={`drum-step-num ${activeStep === i ? "drum-step-num-active" : ""}`}>{i + 1}</span>
                ))}
              </div>
              {DRUM_TRACKS.map(({ id, label, emoji }) => (
                <div key={id} className="drum-row">
                  <span className="drum-track-label">
                    <span className="drum-track-emoji">{emoji}</span>{label}
                  </span>
                  {drumPattern[id].map((on, stepIndex) => (
                    <button key={stepIndex} type="button"
                      className={`drum-step ${on ? "drum-step-on" : "drum-step-off"} ${activeStep === stepIndex ? "drum-step-active" : ""} drum-step-${id}`}
                      onClick={() => setDrumPattern((prev) => ({ ...prev, [id]: prev[id].map((v, i) => i === stepIndex ? !v : v) }))}
                      aria-pressed={on} aria-label={`${label} step ${stepIndex + 1}`} />
                  ))}
                </div>
              ))}
            </div>

            <p className="drum-overlay-hint">Steps sync with the weather sequencer tempo · {bpm} BPM</p>
          </div>
        </div>
      )}

      {/* ── Bass grid overlay ───────────────────────────────────────────────── */}
      {bassGridOpen && (
        <div className="drum-overlay" role="dialog" aria-label="Bass sequencer">
          <div className="drum-overlay-inner bass-overlay-inner">
            <div className="drum-overlay-header">
              <h2 className="drum-overlay-title">
                🎸 Bass Sequencer
                <span className="drum-overlay-subtitle">64 steps · 4 bars of 16th notes</span>
              </h2>
              <div className="drum-overlay-controls">
                <button type="button" className={`btn ${bassEnabled ? "primary" : "ghost"}`} onClick={() => setBassEnabled((v) => !v)}>
                  {bassEnabled ? "Mute" : "Unmute"}
                </button>
                <button type="button" className="btn ghost" onClick={() => setBassGroups(DEFAULT_BASS_GROUPS)}>Reset</button>
                <button type="button" className="btn ghost" onClick={() => setBassGridOpen(false)} aria-label="Close bass sequencer">✕</button>
              </div>
            </div>

            {/* Bass grid: 16 groups, each group is a card */}
            <div className="bass-grid">
              {bassGroups.map((group, groupIndex) => {
                // Which flat step range is this group?
                const groupFlatStart = groupIndex * 4;
                const isGroupActive = activeBassStep !== null &&
                  activeBassStep >= groupFlatStart && activeBassStep < groupFlatStart + 4;

                return (
                  <div key={groupIndex} className={`bass-group ${isGroupActive ? "bass-group-active" : ""}`}>
                    {/* Group header: number + degree selector */}
                    <div className="bass-group-header">
                      <span className="bass-group-num">{groupIndex + 1}</span>
                      {/* Scale degree picker: 8 options */}
                      <div className="bass-degree-picker">
                        {DEGREE_LABELS.map((label, degreeIndex) => (
                          <button
                            key={degreeIndex} type="button"
                            className={`bass-degree-btn ${group.degree === degreeIndex ? "bass-degree-active" : ""}`}
                            onClick={() => setBassGroups((prev) => prev.map((g, i) => i === groupIndex ? { ...g, degree: degreeIndex } : g))}
                            title={`Scale degree ${label}`}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    {/* 4 step buttons within this group */}
                    <div className="bass-group-steps">
                      {group.stepsOn.map((on, stepInGroup) => {
                        const flatStep = groupFlatStart + stepInGroup;
                        const isStepActive = activeBassStep === flatStep;
                        return (
                          <button
                            key={stepInGroup} type="button"
                            className={`bass-step ${on ? "bass-step-on" : "bass-step-off"} ${isStepActive ? "bass-step-active" : ""}`}
                            onClick={() => setBassGroups((prev) => prev.map((g, i) => i === groupIndex
                              ? { ...g, stepsOn: g.stepsOn.map((v, j) => j === stepInGroup ? !v : v) }
                              : g
                            ))}
                            aria-pressed={on}
                            aria-label={`Group ${groupIndex + 1} step ${stepInGroup + 1}`}
                          >
                            <span className="bass-step-note">
                              {degreeToNote(group.degree, selectedMode, 2, selectedRoot)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="drum-overlay-hint">
              {bpm} BPM · Mode: {MODE_LABELS[selectedMode]}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};