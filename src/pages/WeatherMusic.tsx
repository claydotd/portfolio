import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
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

type MelodyStep = {
  dateLabel: string;
  weatherMain: string;
  weatherDescription: string;
  weatherIcon: string;
  role: "min" | "max";
  temp: number;
  tempMin: number;
  tempMax: number;
  note: string;
  icy: boolean;
  duration: string;
  lengthLabel: string;
};

type ModeName = "ionian" | "aeolian" | "dorian" | "mixolydian";

type DrumTrack = "kick" | "snare" | "hihat" | "clap";

// Bass panel: 16 groups, each group has 4 steps
// Each step stores a scale degree index (0–7, where 0 = root, 7 = octave up)
// The user picks a scale degree for each group (all 4 steps in the group play the same note)
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
  { id: "copenhagen-dk", name: "Copenhagen", countryName: "Denmark", lat: 55.6760, lon: 12.5683 },
  { id: "aarhus-dk", name: "Aarhus", countryName: "Denmark", lat: 56.1567, lon: 10.2107 },
  { id: "toronto-ca", name: "Toronto", countryName: "Canada", lat: 43.6532, lon: -79.3832 },
  { id: "vancouver-ca", name: "Vancouver", countryName: "Canada", lat: 49.2462, lon: -123.1162 },
  { id: "paris-fr", name: "Paris", countryName: "France", lat: 48.8566, lon: 2.3522 },
  { id: "berlin-de", name: "Berlin", countryName: "Germany", lat: 52.52, lon: 13.405 },
  { id: "madrid-es", name: "Madrid", countryName: "Spain", lat: 40.4168, lon: -3.7038 },
  { id: "rome-it", name: "Rome", countryName: "Italy", lat: 41.9028, lon: 12.4964 },
  { id: "new-york-us", name: "New York", countryName: "United States", lat: 40.7128, lon: -74.006 },
  { id: "nashville-us", name: "Nashville", countryName: "United States", lat: 36.1627, lon: -86.7816 },
  { id: "sao-paulo-br", name: "Sao Paulo", countryName: "Brazil", lat: -23.5558, lon: -46.6396 },
  { id: "buenos-aires-ar", name: "Buenos Aires", countryName: "Argentina", lat: -34.6037, lon: -58.3816 },
  { id: "lagos-ng", name: "Lagos", countryName: "Nigeria", lat: 6.5244, lon: 3.3792 },
  { id: "cape-town-za", name: "Cape Town", countryName: "South Africa", lat: -33.9249, lon: 18.4241 },
  { id: "manila-ph", name: "Manila", countryName: "Philippines", lat: 14.5995, lon: 120.9842 },
  { id: "tokyo-jp", name: "Tokyo", countryName: "Japan", lat: 35.6762, lon: 139.6503 },
  { id: "seoul-kr", name: "Seoul", countryName: "South Korea", lat: 37.5665, lon: 126.978 },
  { id: "mumbai-in", name: "Mumbai", countryName: "India", lat: 19.076, lon: 72.8777 },
  { id: "dubai-ae", name: "Dubai", countryName: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { id: "sydney-au", name: "Sydney", countryName: "Australia", lat: -33.8688, lon: 151.2093 },
  { id: "melbourne-au", name: "Melbourne", countryName: "Australia", lat: -37.8409, lon: 144.9464 },
  { id: "auckland-nz", name: "Auckland", countryName: "New Zealand", lat: -36.8509, lon: 174.7645 },
  { id: "mcmurdo-aq", name: "McMurdo Station", countryName: "Antarctica", lat: -77.8419, lon: 166.6863 },
];

// for matching location to nearest available city in case API doesn't deliver forecast for user location
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

// Chromatic root notes (semitone offset from C)
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

// Scale degree display labels (because real people don't 0-index these things)
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
  { id: "kick",  label: "Kick",   emoji: "🟡" },
  { id: "snare", label: "Snare",  emoji: "🩷" },
  { id: "hihat", label: "Hi-Hat", emoji: "🟠" },
  { id: "clap",  label: "Clap",   emoji: "🟣" },
];

const DEFAULT_DRUM_PATTERN: Record<DrumTrack, boolean[]> = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
  hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
  clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,1,1].map(Boolean),
};

// Default bass: 16 groups, 1 bar root, 1 bar 4^, 1 bar root, 1 bar 4^
const DEFAULT_BASS_GROUPS: BassGroup[] = Array.from({ length: 16 }, (_, i) => {
  const cycleIndex = i % 8; // repeat every 8 steps

  return {
    degree: cycleIndex < 4 ? 0 : 3,
    stepsOn: [true, true, true, true],
  };
});

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const OPENWEATHER_ONECALL_ENDPOINT = "https://api.openweathermap.org/data/3.0/onecall";
// One Call returns 8 daily entries. Each day becomes two sequencer steps.
const FORECAST_DAY_COUNT = 8;
const FETCH_TIMEOUT_MS = 12000;

const limitForecast = (days: ForecastDay[]): ForecastDay[] => days.slice(0, FORECAST_DAY_COUNT);

const fallbackForecast = (locationId: string): ForecastDay[] =>
  limitForecast(getFallbackForecast(locationId));

type OpenWeatherOneCallResponse = {
  daily?: Array<{
    dt: number;
    temp: { min: number; max: number };
    weather: Array<{ main: string; description: string }>;
  }>;
};

const parseOneCallForecastDays = (data: OpenWeatherOneCallResponse): ForecastDay[] => {
  const days: ForecastDay[] =
    data.daily?.slice(0, FORECAST_DAY_COUNT).map((day) => ({
      dateLabel: toDateLabel(day.dt),
      weatherMain: day.weather[0]?.main ?? "Unknown",
      weatherDescription: day.weather[0]?.description ?? "n/a",
      tempMin: day.temp.min,
      tempMax: day.temp.max,
      weatherIcon: weatherIconForCondition(day.weather[0]?.main ?? ""),
    })) ?? [];

  if (days.length === 0) throw new Error("No forecast data returned from One Call API.");
  return days;
};

// 0°C is the root in octave 2. Each rounded degree Celsius is one scale step
// up from that root. Negative temperatures use the same positive count, starting
// an octave higher, and play on the ice synth.
const ROOT_OCTAVE_MIDI = 36; // C2
const ICE_OCTAVE_LIFT = 12;

const tempToMelodyNote = (
  temp: number,
  mode: ModeName,
  rootSemitones: number,
): { note: string; icy: boolean } => {
  const rounded = Math.round(temp);
  const icy = rounded < 0;
  const degrees = Math.abs(rounded);
  const intervals = MODE_INTERVALS[mode];
  const scaleLength = intervals.length;
  const octaveShift = Math.floor(degrees / scaleLength);
  const semitone = (intervals[degrees % scaleLength] ?? 0) + octaveShift * 12;
  const register = ROOT_OCTAVE_MIDI + (icy ? ICE_OCTAVE_LIFT : 0);
  const midi = Math.min(127, Math.max(0, register + rootSemitones + semitone));
  return { note: Tone.Frequency(midi, "midi").toNote(), icy };
};

// Clear is the shortest gate. Heavier conditions hold longer.
const weatherToNoteLength = (condition: string): { duration: string; label: string } => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder") || normalized.includes("squall") || normalized.includes("tornado")) {
    return { duration: "2n", label: "1/2" };
  }
  if (normalized.includes("snow") || normalized.includes("rain")) {
    return { duration: "4n", label: "1/4" };
  }
  if (
    normalized.includes("drizzle") ||
    normalized.includes("mist") ||
    normalized.includes("fog") ||
    normalized.includes("haze") ||
    normalized.includes("smoke") ||
    normalized.includes("dust") ||
    normalized.includes("sand") ||
    normalized.includes("ash")
  ) {
    return { duration: "8n", label: "1/8" };
  }
  if (normalized.includes("cloud")) return { duration: "16n", label: "1/16" };
  if (normalized.includes("clear")) return { duration: "32n", label: "1/32" };
  return { duration: "16n", label: "1/16" };
};

const buildMelodySteps = (days: ForecastDay[], mode: ModeName, rootSemitones: number): MelodyStep[] =>
  days.flatMap((day) => {
    const { duration, label } = weatherToNoteLength(day.weatherMain);
    return (["min", "max"] as const).map((role) => {
      const temp = role === "min" ? day.tempMin : day.tempMax;
      const { note, icy } = tempToMelodyNote(temp, mode, rootSemitones);
      return {
        dateLabel: day.dateLabel,
        weatherMain: day.weatherMain,
        weatherDescription: day.weatherDescription,
        weatherIcon: day.weatherIcon,
        role,
        temp,
        tempMin: day.tempMin,
        tempMax: day.tempMax,
        note,
        icy,
        duration,
        lengthLabel: label,
      };
    });
  });
// avgTemp: freq high when warm, low when cold
const tempToFilterCutoff = (avgTemp: number): number => {
  const clamped = Math.max(-10, Math.min(40, avgTemp));
  const t = (clamped + 10) / 50;
  return Math.round(7000 + t * 2000);
};

const tempToRelease = (tempMax: number): number => {
  const clamped = Math.max(-1, Math.min(32, tempMax));
  const t = 1 - (clamped + 1) / 33;
  return parseFloat((0.1 + t * 1.0).toFixed(2));
};

// legacy function, for changing distortion amount with each step
const descriptionToDistortion = (description: string): number => {
  // const d = description.toLowerCase();
  // if (d.includes("thunder") || d.includes("storm"))    return 0.05;
  // if (d.includes("heavy"))                             return 0.04;
  // if (d.includes("moderate") || d.includes("drizzle")) return 0.03;
  // if (d.includes("light") || d.includes("overcast"))   return 0.02;
  // if (d.includes("clear") || d.includes("few"))        return 0.01;
  return 0.00;
};

// velocity mapped to temperature range (high - low) for the day
const tempRangeToVelocity = (tempMin: number, tempMax: number): number => {
  const spread = Math.max(0, tempMax - tempMin);
  const clamped = Math.min(spread, 15); // cap at 15°C spread
  const t = clamped / 15; // 0 → 1
  return 1 - t * 0.95;
};

// return note from scale degree + mode + root + base octave
const degreeToNote = (degree: number, mode: ModeName, octave: number, rootSemitones = 0): string => {
  const intervals = MODE_INTERVALS[mode];
  // degree 7 = octave above root
  const interval = degree >= 7 ? 12 : (intervals[degree] ?? 0);
  const midi = 36 + rootSemitones + interval + (octave - 3) * 12; // base C2=36
  return Tone.Frequency(midi, "midi").toNote();
};

// Tiny silent WAV — unlocks Web Audio on iOS when the hardware mute switch is on
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

let silentUnlockAudio: HTMLAudioElement | null = null;

// Must be invoked synchronously inside the tap/click handler. Awaiting this
// before Tone.start() spends the iOS user-gesture and leaves the AudioContext suspended.
const unlockHtmlAudio = () => {
  if (!silentUnlockAudio) {
    silentUnlockAudio = new Audio(SILENT_WAV_DATA_URI);
    silentUnlockAudio.setAttribute("playsinline", "true");
    silentUnlockAudio.muted = false;
    silentUnlockAudio.volume = 0.01;
  }
  try {
    silentUnlockAudio.currentTime = 0;
  } catch {
    // ignore seek failures on a not-yet-loaded clip
  }
  // Don't await play(): Safari often never settles this promise for a data-URI clip,
  // which left the Start button stuck on "Starting…".
  void silentUnlockAudio.play().then(() => silentUnlockAudio?.pause()).catch(() => {});
};

export const WeatherMusic = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(DEFAULT_LOCATION);
  const [locationSearch, setLocationSearch] = useState(formatLocationLabel(DEFAULT_LOCATION));
  const [forecast, setForecast] = useState<ForecastDay[]>(() => fallbackForecast(DEFAULT_LOCATION.id));
  const [stepsOn, setStepsOn] = useState<boolean[]>(() =>
    Array.from({ length: FORECAST_DAY_COUNT * 2 }, () => true),
  );
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
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

  // Volume default states dB
  const [melodyVolume, setMelodyVolume] = useState(-16);
  const [drumVolume, setDrumVolume] = useState(-6);
  const [bassVolume, setBassVolume] = useState(-10);

  // Drum default state
  const [drumPattern, setDrumPattern] = useState<Record<DrumTrack, boolean[]>>(DEFAULT_DRUM_PATTERN);
  const [drumsEnabled, setDrumsEnabled] = useState(false);
  const [drumGridOpen, setDrumGridOpen] = useState(false);

  // Bass default state
  const [bassGroups, setBassGroups] = useState<BassGroup[]>(DEFAULT_BASS_GROUPS);
  const [bassEnabled, setBassEnabled] = useState(false);
  const [bassGridOpen, setBassGridOpen] = useState(false);
  // activeBassStep tracks which of the 64 bass steps is currently active
  const [activeBassStep, setActiveBassStep] = useState<number | null>(null);

  useEffect(() => {
    if (!drumGridOpen && !bassGridOpen) return;
    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [drumGridOpen, bassGridOpen]);

  // Refs
  // Polyphonic synth stuff
  const polySynthRef = useRef<Tone.PolySynth | null>(null);
  const polyChorusRef = useRef<Tone.Chorus | null>(null);
  const polyReverbRef = useRef<Tone.Reverb | null>(null);
  const polyFilterRef = useRef<Tone.Filter | null>(null);
  // distortion node for melody synth
  const polyDistortionRef = useRef<Tone.Distortion | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);
  // Glassy FM bell for below-freezing steps
  const iceSynthRef = useRef<Tone.PolySynth<Tone.FMSynth> | null>(null);
  const iceChorusRef = useRef<Tone.Chorus | null>(null);
  const iceReverbRef = useRef<Tone.Reverb | null>(null);

  const locationComboboxRef = useRef<HTMLDivElement | null>(null);

  // Drum refs
  const drumSynthsRef = useRef<Record<string, Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth> | null>(null);
  // Ref for the layered snare tonal synth (not stored in drumSynthsRef to keep trigger logic clean)
  const snareToneRef = useRef<Tone.MembraneSynth | null>(null);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);
  // Drum bus volume
  const drumGainRef = useRef<Tone.Gain | null>(null);
  const drumReverbRef = useRef<Tone.Reverb | null>(null);
  const drumCompressorRef = useRef<Tone.Compressor | null>(null);
  const drumEQRef = useRef<Tone.EQ3 | null>(null);

  // Bass refs
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const bassSequenceRef = useRef<Tone.Sequence<number> | null>(null);

  // Audio bootstrap — graph is created only after a user gesture (required on iOS)
  const audioReadyRef = useRef(false);
  const [audioReady, setAudioReady] = useState(false);
  const isPlayingRef = useRef(false);
  const melodyVolumeRef = useRef(melodyVolume);
  const drumVolumeRef = useRef(drumVolume);
  const bassVolumeRef = useRef(bassVolume);
  const drumsEnabledRef = useRef(drumsEnabled);
  const drumPatternRef = useRef(drumPattern);
  const bassEnabledRef = useRef(bassEnabled);
  const bassGroupsRef = useRef(bassGroups);
  const selectedModeRef = useRef(selectedMode);
  const selectedRootRef = useRef(selectedRoot);
  const stepsOnRef = useRef(stepsOn);
  melodyVolumeRef.current = melodyVolume;
  drumVolumeRef.current = drumVolume;
  bassVolumeRef.current = bassVolume;
  drumsEnabledRef.current = drumsEnabled;
  drumPatternRef.current = drumPattern;
  bassEnabledRef.current = bassEnabled;
  bassGroupsRef.current = bassGroups;
  selectedModeRef.current = selectedMode;
  selectedRootRef.current = selectedRoot;
  stepsOnRef.current = stepsOn;
  isPlayingRef.current = isPlaying;

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

  const melodySteps = useMemo(
    () => buildMelodySteps(forecast, selectedMode, selectedRoot),
    [forecast, selectedMode, selectedRoot],
  );

  useEffect(() => {
    const count = melodySteps.length;
    setStepsOn((prev) =>
      prev.length === count ? prev : Array.from({ length: count }, (_, i) => prev[i] ?? true),
    );
  }, [melodySteps.length]);

  const disposeAudioGraph = useCallback(() => {
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
    polyDistortionRef.current?.dispose();
    polyDistortionRef.current = null;
    iceSynthRef.current?.dispose();
    iceSynthRef.current = null;
    iceChorusRef.current?.dispose();
    iceChorusRef.current = null;
    iceReverbRef.current?.dispose();
    iceReverbRef.current = null;

    drumSequenceRef.current?.stop();
    drumSequenceRef.current?.dispose();
    drumSequenceRef.current = null;
    if (drumSynthsRef.current) {
      Object.values(drumSynthsRef.current).forEach((synth) => synth.dispose());
      drumSynthsRef.current = null;
    }
    snareToneRef.current?.dispose();
    snareToneRef.current = null;
    drumReverbRef.current?.dispose();
    drumReverbRef.current = null;
    drumCompressorRef.current?.dispose();
    drumCompressorRef.current = null;
    drumEQRef.current?.dispose();
    drumEQRef.current = null;
    drumGainRef.current?.dispose();
    drumGainRef.current = null;

    bassSequenceRef.current?.stop();
    bassSequenceRef.current?.dispose();
    bassSequenceRef.current = null;
    bassSynthRef.current?.dispose();
    bassSynthRef.current = null;

    void Tone.Transport.stop();
    Tone.Transport.cancel(0);
    audioReadyRef.current = false;
  }, []);

  const initAudioGraph = useCallback(async () => {
    // Classic 80's sparkly poly synth
    polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.06,
        decay: 0.4,
        sustain: 0.65,
        release: 2.8,
      },
      volume: melodyVolumeRef.current,
    });

    polyChorusRef.current = new Tone.Chorus({
      frequency: 2.8,
      delayTime: 3.5,
      depth: 0.2,
      wet: 0.6,
    }).start();

    polyReverbRef.current = new Tone.Reverb({ decay: 4.0, wet: 0.35 });
    polyDistortionRef.current = new Tone.Distortion({ distortion: 0, wet: 1.0 });
    polyFilterRef.current = new Tone.Filter({ type: "lowpass", frequency: 4000, rolloff: -12 });

    // signal chain: polySynth → chorus → distortion → lowpass filter → reverb → destination
    polySynthRef.current.connect(polyChorusRef.current);
    polyChorusRef.current.connect(polyDistortionRef.current);
    polyDistortionRef.current.connect(polyFilterRef.current);
    polyFilterRef.current.connect(polyReverbRef.current);
    polyReverbRef.current.toDestination();

    // Inharmonic FM bell: fast strike, long glassy tail, kept out of the warm lowpass.
    iceSynthRef.current = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 5.07,
      modulationIndex: 2.6,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: {
        attack: 0.004,
        decay: 0.55,
        sustain: 0.08,
        release: 2.4,
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.4,
        sustain: 0.02,
        release: 1.6,
      },
      volume: melodyVolumeRef.current,
    });

    iceChorusRef.current = new Tone.Chorus({
      frequency: 0.35,
      delayTime: 2.8,
      depth: 0.55,
      wet: 0.4,
    }).start();

    iceReverbRef.current = new Tone.Reverb({ decay: 7.5, wet: 0.62 });

    iceSynthRef.current.connect(iceChorusRef.current);
    iceChorusRef.current.connect(iceReverbRef.current);
    iceReverbRef.current.toDestination();

    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 8,
      envelope: {
        attack: 0.001,
        decay: 0.28,
        sustain: 0,
        release: 0.18,
      },
      volume: 2,
    });

    const snareNoise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0,
        release: 0.08,
      },
      volume: -2,
    });

    const snareTone = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 3,
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.04,
      },
      volume: -8,
    });
    snareToneRef.current = snareTone;

    const hihatSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.04,
        release: 0.01,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 6000,
      octaves: 1.5,
      volume: -16,
    });

    const clapSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: {
        attack: 0.001,
        decay: 0.09,
        sustain: 0,
        release: 0.06,
      },
      volume: -4,
    });

    const drumReverb = new Tone.Reverb({
      decay: 1.6,
      wet: 0.25,
    }).toDestination();
    drumReverbRef.current = drumReverb;

    const drumCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 6,
      attack: 0.002,
      release: 0.08,
    });
    drumCompressorRef.current = drumCompressor;

    const drumEQ = new Tone.EQ3({
      low: 3,
      mid: -2,
      high: 4,
    });
    drumEQRef.current = drumEQ;

    const drumGain = new Tone.Gain(Tone.dbToGain(drumVolumeRef.current));
    drumGainRef.current = drumGain;

    kickSynth.connect(drumEQ);
    snareNoise.connect(drumEQ);
    snareTone.connect(drumEQ);
    hihatSynth.connect(drumEQ);
    clapSynth.connect(drumEQ);
    drumEQ.connect(drumCompressor);
    drumCompressor.connect(drumGain);
    drumGain.connect(drumReverb);

    drumSynthsRef.current = {
      kick: kickSynth,
      snare: snareNoise,
      hihat: hihatSynth,
      clap: clapSynth,
    };

    bassSynthRef.current = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.6,
        release: 0.3,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3,
        baseFrequency: 80,
        octaves: 2.5,
      },
      volume: bassVolumeRef.current,
    }).toDestination();

    Tone.Transport.bpm.value = bpm;

    // Reverb impulse rendering uses OfflineAudioContext. Safari frequently never
    // resolves that render (especially with several reverbs at once), so playback
    // must not wait on `.ready`. The dry path is audible immediately; wet fills in
    // if the impulse finishes later.
    void Promise.all([
      polyReverbRef.current.ready,
      iceReverbRef.current.ready,
      drumReverb.ready,
    ]).catch((error) => {
      console.error(error);
    });
  }, [bpm]);

  const ensureInFlightRef = useRef<Promise<boolean> | null>(null);

  const ensureAudioReady = useCallback((): Promise<boolean> => {
    if (audioReadyRef.current && polySynthRef.current && iceSynthRef.current && Tone.getContext().state === "running") {
      return Promise.resolve(true);
    }
    if (ensureInFlightRef.current) return ensureInFlightRef.current;

    // Kick off unlock + resume in this synchronous turn, before any await.
    // Safari's resume()/play() promises can stay pending forever even after the
    // context is running, so poll state instead of awaiting those promises.
    unlockHtmlAudio();
    const ctx = Tone.getContext();
    void Tone.start();
    void ctx.resume();

    const pending = (async () => {
      const deadline = performance.now() + 1500;
      while (Tone.getContext().state !== "running" && performance.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      if (Tone.getContext().state !== "running") {
        return false;
      }

      if (!audioReadyRef.current || !polySynthRef.current || !iceSynthRef.current) {
        try {
          await initAudioGraph();
          audioReadyRef.current = true;
          setAudioReady(true);
        } catch (error) {
          console.error(error);
          disposeAudioGraph();
          return false;
        }
      }

      return true;
    })();

    ensureInFlightRef.current = pending;
    void pending.finally(() => {
      if (ensureInFlightRef.current === pending) ensureInFlightRef.current = null;
    });
    return pending;
  }, [disposeAudioGraph, initAudioGraph]);

  // Dispose Tone graph on unmount only — creation happens on first Start gesture
  useEffect(() => () => disposeAudioGraph(), [disposeAudioGraph]);

  // Volume sync effects
  useEffect(() => {
    if (polySynthRef.current) {
      polySynthRef.current.set({ volume: melodyVolume });
    }
    if (iceSynthRef.current) {
      iceSynthRef.current.set({ volume: melodyVolume });
    }
  }, [melodyVolume]);

  useEffect(() => {
    if (drumGainRef.current) {
      drumGainRef.current.gain.rampTo(Tone.dbToGain(drumVolume), 0.05);
    }
  }, [drumVolume]);

  useEffect(() => {
    if (bassSynthRef.current) {
      bassSynthRef.current.set({ volume: bassVolume });
    }
  }, [bassVolume]);

  // Melody sequence stays on the transport for the whole playback. Step on/off
  // is read from a ref so toggling a step doesn't rebuild the sequence off the grid.
  useEffect(() => {
    if (!audioReady || !polySynthRef.current || !iceSynthRef.current || melodySteps.length === 0) return;
    sequenceRef.current?.dispose();

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        setAnimFrame(Math.floor(stepIndex / 2) % images.length);
        if (!stepsOnRef.current[stepIndex]) return;

        const step = melodySteps[stepIndex];
        if (!step) return;

        const velocity = tempRangeToVelocity(step.tempMin, step.tempMax);

        if (step.icy) {
          iceSynthRef.current?.triggerAttackRelease(step.note, step.duration, time, velocity);
          return;
        }

        const poly = polySynthRef.current;
        if (!poly) return;

        const release = 1.5 + tempToRelease(step.temp) * 1.2;
        poly.set({ envelope: { release } });

        const cutoff = tempToFilterCutoff(step.temp);
        if (polyFilterRef.current) {
          polyFilterRef.current.frequency.rampTo(cutoff, 0.05);
        }

        const distortionAmount = descriptionToDistortion(step.weatherDescription);
        if (polyDistortionRef.current) {
          polyDistortionRef.current.distortion = distortionAmount;
        }

        poly.triggerAttackRelease(step.note, step.duration, time, velocity);
      },
      melodySteps.map((_, i) => i),
      "16n"
    );

    if (isPlaying) {
      const startAt = Tone.Transport.state === "started" ? Tone.Transport.seconds : 0;
      sequenceRef.current.start(startAt);
    }
  }, [audioReady, isPlaying, melodySteps]);

  // Drum sequence stays on the transport for the whole playback. Mute and pattern
  // edits are read from refs so they don't rebuild the sequence off the grid.
  useEffect(() => {
    const synths = drumSynthsRef.current;
    if (!audioReady || !synths) return;
    drumSequenceRef.current?.dispose();

    drumSequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        if (!drumsEnabledRef.current) return;
        const pattern = drumPatternRef.current;
        (Object.keys(pattern) as DrumTrack[]).forEach((track) => {
          if (!pattern[track][stepIndex]) return;
          const synth = synths[track];
          if (track === "kick") {
            (synth as Tone.MembraneSynth).triggerAttackRelease("C1", "16n", time);
          } else if (track === "snare") {
            // fire both noise layer and tonal crack layer together
            (synth as Tone.NoiseSynth).triggerAttackRelease("16n", time);
            snareToneRef.current?.triggerAttackRelease("C2", "16n", time);
          } else if (track === "clap") {
            (synth as Tone.NoiseSynth).triggerAttackRelease("16n", time);
          } else if (track === "hihat") {
            (synth as Tone.MetalSynth).triggerAttackRelease("16n", time);
          }
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      "16n"
    );

    if (isPlaying) {
      const startAt = Tone.Transport.state === "started" ? Tone.Transport.seconds : 0;
      drumSequenceRef.current.start(startAt);
    }
  }, [audioReady, isPlaying]);

  // Bass sequence stays on the transport for the whole playback. Mute, pattern,
  // and scale edits are read from refs so they don't rebuild the sequence off the grid.
  useEffect(() => {
    const synth = bassSynthRef.current;
    if (!audioReady || !synth) return;
    bassSequenceRef.current?.dispose();

    // Flatten 16 groups × 4 steps into 64-step array
    const steps64 = Array.from({ length: 64 }, (_, i) => i);

    bassSequenceRef.current = new Tone.Sequence(
      (time, flatStep) => {
        setActiveBassStep(flatStep);
        if (!bassEnabledRef.current) return;

        const groupIndex = Math.floor(flatStep / 4);
        const stepInGroup = flatStep % 4;
        const group = bassGroupsRef.current[groupIndex];
        if (!group || !group.stepsOn[stepInGroup]) return;

        const note = degreeToNote(group.degree, selectedModeRef.current, 2, selectedRootRef.current);
        synth.triggerAttackRelease(note, "16n", time);
      },
      steps64,
      "16n"
    );

    if (isPlaying) {
      const startAt = Tone.Transport.state === "started" ? Tone.Transport.seconds : 0;
      bassSequenceRef.current.start(startAt);
    }
  }, [audioReady, isPlaying]);

  // BPM sync
  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.08);
  }, [bpm]);

  
  //  Weather fetch
  const fetchForecast = useCallback(async () => {
    setIsFetchingWeather(true);
    setStatusMessage(`Loading forecast for ${formatLocationLabel(selectedLocation)}...`);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const apiKey = OPENWEATHER_API_KEY;
      if (!apiKey) {
        window.clearTimeout(timeoutId);
        throw new Error("OpenWeather API key is not configured");
      }

      const params = new URLSearchParams({
        lat: String(selectedLocation.lat),
        lon: String(selectedLocation.lon),
        exclude: "current,minutely,hourly,alerts",
        units: "metric",
        appid: apiKey,
      });
      const response = await fetch(`${OPENWEATHER_ONECALL_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
      window.clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Forecast request failed (${response.status})`);
      const data = (await response.json()) as OpenWeatherOneCallResponse;
      const days = parseOneCallForecastDays(data);
      setForecast(days);
      setStatusMessage(`Loaded ${days.length}-day forecast for ${formatLocationLabel(selectedLocation)}.`);
    } catch (error) {
      console.error(error);
      setForecast(fallbackForecast(selectedLocation.id));
      const nearest = findNearestLocation(
        selectedLocation.lat,
        selectedLocation.lon
      );
      
      // Update location to the nearest known one
      setSelectedLocation(nearest);
      setLocationSearch(formatLocationLabel(nearest));
      
      // Use its fallback forecast
      setForecast(fallbackForecast(nearest.id));
      
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
        setForecast(fallbackForecast(nearest.id));
      } else {
        setForecast(fallbackForecast(selectedLocation.id));
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

  // Geolocation
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

  // Close location menu on outside click
  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      if (!locationComboboxRef.current?.contains(event.target as Node)) setIsLocationMenuOpen(false);
    };
    window.addEventListener("mousedown", onDocumentPointerDown);
    return () => window.removeEventListener("mousedown", onDocumentPointerDown);
  }, []);

  // Start Transport once sequences exist after audio unlock + play
  useEffect(() => {
    if (!isPlaying || !audioReady || !sequenceRef.current) return;
    if (Tone.Transport.state !== "started") {
      void Tone.Transport.start();
    }
  }, [isPlaying, audioReady]);

  // Resume AudioContext after iOS suspends it (tab backgrounded / screen locked)
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !isPlayingRef.current) return;
      const ctx = Tone.getContext();
      if (ctx.state === "suspended") {
        unlockHtmlAudio();
        void Tone.start();
        void ctx.resume();
      }
      if (isPlayingRef.current && Tone.Transport.state !== "started") {
        void Tone.Transport.start("+0");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Playback toggle
  const onTogglePlay = async () => {
    if (!isPlaying) {
      setIsStarting(true);
      const ready = await ensureAudioReady();
      setIsStarting(false);
      if (!ready) {
        setStatusMessage("Tap Start again to enable audio.");
        return;
      }
      // Sequences are built/started by effects once audioReady + isPlaying are both true
      setIsPlaying(true);
      return;
    }
    sequenceRef.current?.stop();
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
        <div className="hero-left">
          <p className="pill">Project · Weather forecast step sequencer</p>
          <h1>Weather Music</h1>
          <p className="subtitle">
          A synth that takes the weather forcast and turns it into a melody! It takes the 8-day forecast from OpenWeather, and uses the 
          min and max temperatures to map notes to a 16-step sequence. Fully programmable Drum and Bass step sequencers included. 
          Have a play around with it and make some <em>weather music</em>! You can toggle on/off each step by clicking on it.
          </p>
        </div>
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

          {/* Melody volume — always visible in toolbar */}
          <label className="form-field weather-volume-control">
            <span>Melody volume ({melodyVolume} dB)</span>
            <input
              type="range"
              min={-40}
              max={0}
              step={1}
              value={melodyVolume}
              onChange={(e) => setMelodyVolume(Number(e.target.value))}
            />
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

          <button type="button" className="btn ghost weather-reload-btn"
            onClick={() => setReloadCount((v) => v + 1)} disabled={isFetchingWeather}>
            {isFetchingWeather ? "Reloading..." : "Reload weather"}
          </button>

          <div className="weather-sequencer-start-row">
            <button
              type="button"
              className={`btn ${isPlaying ? "ghost" : "primary"}`}
              disabled={isStarting}
              onClick={() => void onTogglePlay()}
            >
              {isStarting ? "Starting…" : isPlaying ? "Stop sequencer" : "Start sequencer"}
            </button>
          </div>
        </div>

        <p className="section-subtitle">{statusMessage}</p>

        {/* Weather sequencer grid */}
        <div className="weather-sequencer-grid">
          {melodySteps.map((step, index) => {
            const isStepOn = stepsOn[index];
            const isStepActive = activeStep === index;
            const roleLabel = step.role === "min" ? "Min" : "Max";
            return (
              <button
                key={`${step.dateLabel}-${step.role}-${index}`} type="button"
                className={`weather-step ${isStepOn ? "on" : "off"} ${isStepActive ? "active" : ""} ${step.icy ? "ice" : ""}`}
                onClick={() => setStepsOn((prev) => prev.map((v, i) => i === index ? !v : v))}
                aria-label={`${step.dateLabel} ${roleLabel}, ${Math.round(step.temp)} degrees, ${step.note}`}
              >
                <span className="weather-step-day">{step.dateLabel}</span>
                <span className="weather-step-role">{roleLabel}{step.icy ? " · Ice" : ""}</span>
                <span className="weather-step-icon" aria-hidden="true">{step.weatherIcon}</span>
                <span className="weather-step-main">{step.weatherMain}</span>
                <span className="weather-step-temp">{Math.round(step.temp)}°C</span>
                <span className="weather-step-detail">{step.weatherDescription}</span>
                <span className="weather-step-pitch">{step.note} · {step.lengthLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Drum grid overlay ───────────────────────────────────────────────── */}
      {drumGridOpen && (
        <div className="drum-overlay" role="dialog" aria-modal="true" aria-label="Drum sequencer">
          <div className="drum-overlay-inner">
            <div className="drum-overlay-header">
              <h2 className="drum-overlay-title">
                🥁 Drum Machine
                <span className="drum-overlay-subtitle">1 bar · 16th note steps</span>
              </h2>
              <div className="drum-overlay-controls">
                <button type="button" className={`btn ${drumsEnabled ? "primary" : "ghost"}`} onClick={() => setDrumsEnabled((v) => !v)}>
                  {drumsEnabled ? "Mute" : "Unmute"}
                </button>
                <button type="button" className="btn ghost" onClick={() => setDrumPattern(DEFAULT_DRUM_PATTERN)}>Reset</button>
                <button type="button" className="btn ghost" onClick={() => setDrumGridOpen(false)} aria-label="Close drum sequencer">✕</button>
              </div>
            </div>

            {/* Drum volume slider */}
            <label className="form-field overlay-volume-control">
              <span>Drum volume ({drumVolume} dB)</span>
              <input
                type="range"
                min={-40}
                max={0}
                step={1}
                value={drumVolume}
                onChange={(e) => setDrumVolume(Number(e.target.value))}
              />
            </label>

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

            <p className="drum-overlay-hint">
              Steps sync with the weather sequencer tempo · {bpm} BPM
              <span className="drum-scroll-hint"> · Swipe sideways for all 16 steps</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Bass grid overlay ───────────────────────────────────────────────── */}
      {bassGridOpen && (
        <div className="drum-overlay" role="dialog" aria-modal="true" aria-label="Bass sequencer">
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

            {/* Bass volume slider */}
            <label className="form-field overlay-volume-control">
              <span>Bass volume ({bassVolume} dB)</span>
              <input
                type="range"
                min={-40}
                max={0}
                step={1}
                value={bassVolume}
                onChange={(e) => setBassVolume(Number(e.target.value))}
              />
            </label>

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