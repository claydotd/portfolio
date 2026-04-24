import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { weather_api_key } from './secrets';
import img1 from "./1.png";
import img2 from "./2.png";
import img3 from "./3.png";
import img4 from "./4.png";

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

const formatLocationLabel = (location: LocationOption) =>
  location.countryName ? `${location.name}, ${location.countryName}` : location.name;

// Scale degrees for different weather conditions
const mapWeatherToScaleDegree = (condition: string): number => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder")) return 7;
  if (normalized.includes("rain") || normalized.includes("drizzle")) return 5;
  if (normalized.includes("snow")) return 2;
  if (normalized.includes("cloud")) return 4;
  if (normalized.includes("mist") || normalized.includes("fog")) return 1;
  if (normalized.includes("clear")) return 0;
  return 3;
};

const toDateLabel = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Early spring in Scotland: cold, lots of cloud and rain, occasional clear spells
const SCOTLAND_SPRING_FORECAST: ForecastDay[] = [
  { dateLabel: "Day 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",   tempMin: 3,  tempMax: 8,  weatherIcon: "☁️" },
  { dateLabel: "Day 2",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 9,  weatherIcon: "🌧️" },
  { dateLabel: "Day 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7,  weatherIcon: "🌧️" },
  { dateLabel: "Day 4",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 7,  weatherIcon: "☁️" },
  { dateLabel: "Day 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9,  weatherIcon: "☀️" },
  { dateLabel: "Day 6",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 3,  tempMax: 6,  weatherIcon: "🌫️" },
  { dateLabel: "Day 7",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 4,  tempMax: 8,  weatherIcon: "🌧️" },
  { dateLabel: "Day 8",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 3,  tempMax: 9,  weatherIcon: "☁️" },
  { dateLabel: "Day 9",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8,  weatherIcon: "🌧️" },
  { dateLabel: "Day 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10, weatherIcon: "☀️" },
  { dateLabel: "Day 11", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8,  weatherIcon: "☁️" },
  { dateLabel: "Day 12", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -1, tempMax: 3,  weatherIcon: "❄️" },
  { dateLabel: "Day 13", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 6,  weatherIcon: "☁️" },
  { dateLabel: "Day 14", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9,  weatherIcon: "🌧️" },
  { dateLabel: "Day 15", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 11, weatherIcon: "☀️" },
  { dateLabel: "Day 16", weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 4,  tempMax: 7,  weatherIcon: "🌫️" },
];

const buildFallbackForecast = (): ForecastDay[] => SCOTLAND_SPRING_FORECAST;

const MODE_INTERVALS: Record<ModeName, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const MODE_LABELS: Record<ModeName, string> = {
  ionian: "Ionian (Major)",
  aeolian: "Aeolian (Natural Minor)",
  dorian: "Dorian",
  mixolydian: "Mixolydian",
};

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

// Vaporwave default pattern: four-on-the-floor kick, snare on 2&4, running hihat, occasional clap
const DEFAULT_DRUM_PATTERN: Record<DrumTrack, boolean[]> = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
  hihat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
  clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0].map(Boolean),
};

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

  if (normalizedDays.length === 0) {
    throw new Error("No forecast data returned.");
  }

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

/** Maps tempMax (°C) → filter cutoff Hz.
 *  -10°C → ~100 Hz (very dark), 40°C → ~4000 Hz (wide open) */
const tempToFilterCutoff = (tempMax: number): number => {
  const clamped = Math.max(-10, Math.min(40, tempMax));
  const t = (clamped + 10) / 50; // 0–1
  return Math.round(100 + t * t * 3900); // exponential feel
};

/** Maps tempMin (°C) → release time in seconds.
 *  Very cold (-10°C) → 1.2 s long decay, mild (15°C) → 0.2 s tight */
const tempToRelease = (tempMin: number): number => {
  const clamped = Math.max(-10, Math.min(15, tempMin));
  const t = 1 - (clamped + 10) / 25; // 1 when cold, 0 when mild
  return parseFloat((0.2 + t * 1.0).toFixed(2));
};

/** Maps weather description keywords → distortion amount (0–0.6).
 *  "heavy", "thunder", "storm" → more grit; "light", "clear" → clean */
const descriptionToDistortion = (description: string): number => {
  const d = description.toLowerCase();
  if (d.includes("thunder") || d.includes("storm"))  return 0.55;
  if (d.includes("heavy"))                            return 0.40;
  if (d.includes("moderate") || d.includes("drizzle")) return 0.25;
  if (d.includes("light") || d.includes("overcast"))  return 0.10;
  if (d.includes("clear") || d.includes("few"))      return 0.0;
  return 0.15; // default
};

export const WeatherMusic = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(DEFAULT_LOCATION);
  const [locationSearch, setLocationSearch] = useState(formatLocationLabel(DEFAULT_LOCATION));
  const [forecast, setForecast] = useState<ForecastDay[]>(buildFallbackForecast());
  const [stepsOn, setStepsOn] = useState<boolean[]>(Array.from({ length: 16 }, (_, i) => i % 4 === 0));
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(96);
  const [selectedMode, setSelectedMode] = useState<ModeName>("ionian");
  const [statusMessage, setStatusMessage] = useState("Loading forecast...");
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [highlightedLocationIndex, setHighlightedLocationIndex] = useState(-1);
  const [reloadCount, setReloadCount] = useState(0);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  
  const [animFrame, setAnimFrame] = useState(0);

  const [drumPattern, setDrumPattern] = useState<Record<DrumTrack, boolean[]>>(DEFAULT_DRUM_PATTERN);
  const [drumsEnabled, setDrumsEnabled] = useState(false);
  const [drumGridOpen, setDrumGridOpen] = useState(false);

  const synthRef = useRef<Tone.MonoSynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);
  const locationComboboxRef = useRef<HTMLDivElement | null>(null);

  // Drum refs — typed loosely so we can store heterogeneous Tone synths
  const drumSynthsRef = useRef<Record<string, Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth> | null>(null);
  const drumSequenceRef = useRef<Tone.Sequence<number> | null>(null);

  const filteredLocations = useMemo(() => {
    if (showAllLocations) return LOCATION_OPTIONS;
    const query = locationSearch.trim().toLowerCase();
    if (!query) return LOCATION_OPTIONS;
    return LOCATION_OPTIONS.filter((location) => formatLocationLabel(location).toLowerCase().includes(query));
  }, [locationSearch, showAllLocations]);

  useEffect(() => {
    if (!isLocationMenuOpen) {
      setHighlightedLocationIndex(-1);
      return;
    }

    if (filteredLocations.length === 0) {
      setHighlightedLocationIndex(-1);
      return;
    }

    setHighlightedLocationIndex((prev) => {
      if (prev < 0 || prev >= filteredLocations.length) return 0;
      return prev;
    });
  }, [filteredLocations, isLocationMenuOpen]);

  const weatherDrivenPitches = useMemo(
    () =>
      forecast
        .map((day, index) => {
          const mode = MODE_INTERVALS[selectedMode];
          const degree = mapWeatherToScaleDegree(day.weatherMain);
          const interval = mode[degree] ?? mode[0];
          const octave = 2;
          return Tone.Frequency(48 + interval + (octave - 3) * 12, "midi").toNote();
        })
        .slice(0, 16),
    [forecast, selectedMode]
  );

  // ── Bass synth + effects setup (runs once) ───────────────────────────────────
  useEffect(() => {
    // Bass-style MonoSynth with sine oscillator and resonant low-pass filter
    synthRef.current = new Tone.MonoSynth({
      oscillator: { type: "sine" },
      filter: { type: "lowpass", rolloff: -24, Q: 3 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.3,
        release: 0.4,
        baseFrequency: 80,
        octaves: 3,
      },
      volume: -4,
    });

    // Per-step filter cutoff (driven by tempMax)
    filterRef.current = new Tone.Filter(800, "lowpass").toDestination();

    // Per-step distortion (driven by weatherDescription intensity)
    distortionRef.current = new Tone.Distortion(0).toDestination();

    // Chain: synth → filter → distortion → destination
    synthRef.current.connect(filterRef.current);
    filterRef.current.connect(distortionRef.current);

    Tone.Transport.bpm.value = bpm;

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        setAnimFrame(Math.floor(stepIndex / 4));
        if (stepsOn[stepIndex]) {
          const pitch = weatherDrivenPitches[stepIndex] ?? "C2";
          synthRef.current?.triggerAttackRelease(pitch, "8n", time);
        }
      },
      Array.from({ length: 16 }, (_, index) => index),
      "16n"
    );

    return () => {
      sequenceRef.current?.stop();
      sequenceRef.current?.dispose();
      sequenceRef.current = null;
      synthRef.current?.dispose();
      synthRef.current = null;
      filterRef.current?.dispose();
      filterRef.current = null;
      distortionRef.current?.dispose();
      distortionRef.current = null;
      void Tone.Transport.stop();
      Tone.Transport.cancel(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drum synth setup (runs once) ────────────────────────────────────────────
  useEffect(() => {
    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
      volume: -4,
    }).toDestination();

    const snareSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
      volume: -10,
    }).toDestination();

    const hihatSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -18,
    }).toDestination();
    hihatSynth.frequency.value = 400;

    const clapSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
      volume: -14,
    }).toDestination();

    // Add a touch of reverb to the clap for that vaporwave shimmer
    const clapReverb = new Tone.Reverb({ decay: 1.2, wet: 0.45 }).toDestination();
    clapSynth.connect(clapReverb);

    drumSynthsRef.current = { kick: kickSynth, snare: snareSynth, hihat: hihatSynth, clap: clapSynth };

    return () => {
      drumSequenceRef.current?.stop();
      drumSequenceRef.current?.dispose();
      drumSequenceRef.current = null;
      kickSynth.dispose();
      snareSynth.dispose();
      hihatSynth.dispose();
      clapSynth.dispose();
      clapReverb.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const pitch = weatherDrivenPitches[stepIndex] ?? "C2";
        const synth = synthRef.current;

        // Apply per-step parameter changes driven by forecast data
        if (synth && day) {
          const cutoff  = tempToFilterCutoff(day.tempMax);
          const release = tempToRelease(day.tempMin);
          const dist    = descriptionToDistortion(day.weatherDescription);

          // Schedule param changes at the exact step time
          synth.set({ envelope: { release } });
          filterRef.current?.frequency.setValueAtTime(cutoff, time);
          distortionRef.current?.set({ distortion: dist });
        }

        synth?.triggerAttackRelease(pitch, "8n", time);
      },
      Array.from({ length: 16 }, (_, index) => index),
      "16n"
    );

    if (isPlaying) {
      sequenceRef.current.start(0);
    }
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

    if (isPlaying) {
      drumSequenceRef.current.start(0);
    }
  }, [isPlaying, drumsEnabled, drumPattern]);

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
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, FETCH_TIMEOUT_MS);

      const response = await fetch(`${OPENWEATHER_DAILY_ENDPOINT}?${params.toString()}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Forecast request failed (${response.status})`);
      }

      const data = (await response.json()) as OpenWeatherDailyResponse;
      if (data.cod && data.cod !== "200") {
        throw new Error(`OpenWeather error: ${String(data.message ?? data.cod)}`);
      }

      setForecast(parseForecastDays(data));
      setStatusMessage(`Loaded 16-day forecast for ${formatLocationLabel(selectedLocation)}.`);
    } catch (error) {
      console.error(error);
      setForecast(buildFallbackForecast());
      if (error instanceof Error && error.name === "AbortError") {
        setStatusMessage("Weather request timed out. Showing example Scottish spring forecast.");
      } else {
        setStatusMessage("Could not load live forecast. Showing example forecast.");
      }
    } finally {
      setIsFetchingWeather(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    void fetchForecast();
  }, [fetchForecast, reloadCount]);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation: LocationOption = {
          id: "user-location",
          name: "Your Location",
          countryName: "",
          lat: latitude,
          lon: longitude,
        };
        setSelectedLocation(currentLocation);
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
      if (!locationComboboxRef.current?.contains(event.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onDocumentPointerDown);
    return () => {
      window.removeEventListener("mousedown", onDocumentPointerDown);
    };
  }, []);

  // ── Playback toggle ──────────────────────────────────────────────────────────
  const onTogglePlay = async () => {
    if (!sequenceRef.current) return;

    if (!isPlaying) {
      await Tone.start();
      sequenceRef.current.start(0);
      drumSequenceRef.current?.start(0);
      await Tone.Transport.start();
      setIsPlaying(true);
      return;
    }

    sequenceRef.current.stop();
    drumSequenceRef.current?.stop();
    await Tone.Transport.stop();
    setIsPlaying(false);
    setActiveStep(null);
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
        <p className="pill">Project · Weather-driven sequencer</p>
        <h1>Weather Music</h1>
        <p className="subtitle">
          A 16-step sequencer where the sound and note for each step is set by one day of weather data. Use your location or choose a location, then see what the forecast sounds like!
        </p>
        <p className="subtitle">
          At the moment, it's just drums and a monophonic bass synth, but I might add a polyphonic chord synth later...
        </p>
      </header>

      <section className="section weather-music-panel">
        <div className="sequencer-animation">
          <img
            src={images[animFrame % 4]}
            alt="sequencer animation"
            className="sequencer-animation-image"
          />
        </div>
        <div className="weather-music-toolbar">
          <label className="form-field weather-location-picker">
            <span>Location</span>
            <div className="weather-location-combobox" ref={locationComboboxRef}>
              <input
                className="input"
                value={locationSearch}
                onChange={(event) => {
                  setLocationSearch(event.target.value);
                  setShowAllLocations(false);
                  setIsLocationMenuOpen(true);
                }}
                onFocus={() => {
                  setIsLocationMenuOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    if (!isLocationMenuOpen) {
                      setIsLocationMenuOpen(true);
                      return;
                    }
                    setHighlightedLocationIndex((prev) =>
                      filteredLocations.length === 0 ? -1 : Math.min(prev + 1, filteredLocations.length - 1)
                    );
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!isLocationMenuOpen) {
                      setIsLocationMenuOpen(true);
                      return;
                    }
                    setHighlightedLocationIndex((prev) =>
                      filteredLocations.length === 0 ? -1 : Math.max(prev - 1, 0)
                    );
                  } else if (event.key === "Enter") {
                    if (isLocationMenuOpen && highlightedLocationIndex >= 0 && filteredLocations[highlightedLocationIndex]) {
                      event.preventDefault();
                      selectLocation(filteredLocations[highlightedLocationIndex]);
                    }
                  } else if (event.key === "Escape") {
                    if (isLocationMenuOpen) {
                      event.preventDefault();
                      setIsLocationMenuOpen(false);
                      setHighlightedLocationIndex(-1);
                    }
                  }
                }}
                placeholder="Type to filter locations..."
                aria-label="Search location"
                role="combobox"
                aria-expanded={isLocationMenuOpen}
                aria-controls="weather-location-menu"
                aria-activedescendant={
                  highlightedLocationIndex >= 0 ? `weather-location-option-${filteredLocations[highlightedLocationIndex]?.id}` : undefined
                }
              />
              <button
                type="button"
                className="weather-location-toggle"
                aria-label="Toggle location options"
                aria-expanded={isLocationMenuOpen}
                onClick={() => {
                  setIsLocationMenuOpen((prev) => !prev);
                  setShowAllLocations(true);
                }}
              >
                ▾
              </button>
              {isLocationMenuOpen && (
                <ul className="weather-location-menu" id="weather-location-menu" role="listbox">
                  {filteredLocations.map((location, index) => (
                    <li key={location.id}>
                      <button
                        type="button"
                        id={`weather-location-option-${location.id}`}
                        className={`weather-location-option ${highlightedLocationIndex === index ? "highlighted" : ""}`}
                        role="option"
                        aria-selected={highlightedLocationIndex === index}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onMouseEnter={() => {
                          setHighlightedLocationIndex(index);
                        }}
                        onClick={() => {
                          selectLocation(location);
                        }}
                      >
                        {formatLocationLabel(location)}
                      </button>
                    </li>
                  ))}
                  {filteredLocations.length === 0 && <li className="weather-location-empty">No matching locations</li>}
                </ul>
              )}
            </div>
          </label>

          <label className="form-field weather-bpm-control">
            <span>Tempo ({bpm} BPM)</span>
            <input
              type="range"
              min={60}
              max={160}
              step={1}
              value={bpm}
              onChange={(event) => {
                setBpm(Number(event.target.value));
              }}
            />
          </label>

          <label className="form-field weather-mode-control">
            <span>Mode</span>
            <select
              className="input weather-mode-select"
              value={selectedMode}
              onChange={(event) => {
                setSelectedMode(event.target.value as ModeName);
              }}
            >
              {Object.entries(MODE_LABELS).map(([modeKey, modeLabel]) => (
                <option key={modeKey} value={modeKey}>
                  {modeLabel}
                </option>
              ))}
            </select>
          </label>

          {/* Joined drum control pill */}
          <div className="drum-pill">
            <button
              type="button"
              className={`btn drum-pill-drum ${drumsEnabled ? "primary" : "ghost"}`}
              title={drumsEnabled ? "Mute drums" : "Unmute drums"}
              onClick={() => setDrumsEnabled((v) => !v)}
              aria-pressed={drumsEnabled}
            >
              🥁
            </button>
            <button
              type="button"
              className={`btn drum-pill-grid ${drumGridOpen ? "primary" : "ghost"}`}
              title="Edit drum pattern"
              onClick={() => setDrumGridOpen((v) => !v)}
              aria-pressed={drumGridOpen}
            >
              ⊞
            </button>
          </div>

          <button type="button" className={`btn ${isPlaying ? "ghost" : "primary"}`} onClick={() => void onTogglePlay()}>
            {isPlaying ? "Stop sequencer" : "Start sequencer"}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setReloadCount((value) => value + 1);
            }}
            disabled={isFetchingWeather}
          >
            {isFetchingWeather ? "Reloading..." : "Reload weather"}
          </button>
        </div>

        <p className="section-subtitle">{statusMessage}</p>

        <div className="weather-sequencer-grid">
          {forecast.slice(0, 16).map((day, index) => {
            const isStepOn = stepsOn[index];
            const isStepActive = activeStep === index;
            return (
              <button
                key={`${day.dateLabel}-${index}`}
                type="button"
                className={`weather-step ${isStepOn ? "on" : "off"} ${isStepActive ? "active" : ""}`}
                onClick={() => {
                  setStepsOn((prev) => prev.map((value, i) => (i === index ? !value : value)));
                }}
              >
                <span className="weather-step-day">{day.dateLabel}</span>
                <span className="weather-step-icon" aria-hidden="true">
                  {day.weatherIcon}
                </span>
                <span className="weather-step-main">{day.weatherMain}</span>
                <span className="weather-step-temp">
                  {Math.round(day.tempMax)} / {Math.round(day.tempMin)} C
                </span>
                <span className="weather-step-detail">{day.weatherDescription}</span>
                <span className="weather-step-pitch">{weatherDrivenPitches[index] ?? "C2"}</span>
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
                <button
                  type="button"
                  className={`btn ${drumsEnabled ? "primary" : "ghost"}`}
                  onClick={() => setDrumsEnabled((v) => !v)}
                >
                  {drumsEnabled ? "Mute" : "Unmute"}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setDrumPattern(DEFAULT_DRUM_PATTERN)}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setDrumGridOpen(false)}
                  aria-label="Close drum sequencer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="drum-grid">
              {/* Step number header */}
              <div className="drum-row drum-row-header">
                <span className="drum-track-label" />
                {Array.from({ length: 16 }, (_, i) => (
                  <span
                    key={i}
                    className={`drum-step-num ${activeStep === i ? "drum-step-num-active" : ""}`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              {DRUM_TRACKS.map(({ id, label, emoji }) => (
                <div key={id} className="drum-row">
                  <span className="drum-track-label">
                    <span className="drum-track-emoji">{emoji}</span>
                    {label}
                  </span>
                  {drumPattern[id].map((on, stepIndex) => (
                    <button
                      key={stepIndex}
                      type="button"
                      className={`drum-step
                        ${on ? "drum-step-on" : "drum-step-off"}
                        ${activeStep === stepIndex ? "drum-step-active" : ""}
                        drum-step-${id}`}
                      onClick={() =>
                        setDrumPattern((prev) => ({
                          ...prev,
                          [id]: prev[id].map((v, i) => (i === stepIndex ? !v : v)),
                        }))
                      }
                      aria-pressed={on}
                      aria-label={`${label} step ${stepIndex + 1}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <p className="drum-overlay-hint">
              Steps sync with the weather sequencer tempo · {bpm} BPM
            </p>
          </div>
        </div>
      )}
    </section>
  );
};