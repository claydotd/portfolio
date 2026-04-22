import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

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

const mapWeatherToScaleDegree = (condition: string): number => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder")) return 0;
  if (normalized.includes("rain") || normalized.includes("drizzle")) return 1;
  if (normalized.includes("snow")) return 2;
  if (normalized.includes("cloud")) return 4;
  if (normalized.includes("mist") || normalized.includes("fog")) return 5;
  if (normalized.includes("clear")) return 6;
  return 3;
};

const toDateLabel = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const buildFallbackForecast = (): ForecastDay[] =>
  Array.from({ length: 16 }, (_, index) => ({
    dateLabel: `Day ${index + 1}`,
    weatherMain: "Unknown",
    weatherDescription: "forecast unavailable",
    tempMin: 0,
    tempMax: 0,
    weatherIcon: "❔",
  }));

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

const OPENWEATHER_API_KEY = "20678318755a4c9416d000409b8e6607";
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

  const synthRef = useRef<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence<number> | null>(null);
  const locationComboboxRef = useRef<HTMLDivElement | null>(null);

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
          const octave = index < 8 ? 3 : 4;
          return Tone.Frequency(48 + interval + (octave - 3) * 12, "midi").toNote();
        })
        .slice(0, 16),
    [forecast, selectedMode]
  );

  useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.12, sustain: 0.18, release: 0.24 },
      volume: -6,
    }).toDestination();

    Tone.Transport.bpm.value = bpm;

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        if (stepsOn[stepIndex]) {
          const pitch = weatherDrivenPitches[stepIndex] ?? "C4";
          synthRef.current?.triggerAttackRelease(pitch, "16n", time);
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
      void Tone.Transport.stop();
      Tone.Transport.cancel(0);
    };
    // This setup runs once; sequence callback state is refreshed by a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sequenceRef.current) return;
    sequenceRef.current.dispose();

    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        setActiveStep(stepIndex);
        if (stepsOn[stepIndex]) {
          const pitch = weatherDrivenPitches[stepIndex] ?? "C4";
          synthRef.current?.triggerAttackRelease(pitch, "16n", time);
        }
      },
      Array.from({ length: 16 }, (_, index) => index),
      "16n"
    );

    if (isPlaying) {
      sequenceRef.current.start(0);
    }
  }, [isPlaying, stepsOn, weatherDrivenPitches]);

  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.08);
  }, [bpm]);

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
        setStatusMessage("Weather request timed out. Showing placeholder weather steps.");
      } else {
        setStatusMessage("Could not load live forecast. Showing placeholder weather steps.");
      }
    } finally {
      setIsFetchingWeather(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    void fetchForecast();
  }, [fetchForecast, reloadCount]);

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

  const onTogglePlay = async () => {
    if (!sequenceRef.current) return;

    if (!isPlaying) {
      await Tone.start();
      sequenceRef.current.start(0);
      await Tone.Transport.start();
      setIsPlaying(true);
      return;
    }

    sequenceRef.current.stop();
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
          A 16-step sequencer where each step is powered by one day of weather data. Use your location or choose a new
          city, then play the forecast.
        </p>
      </header>

      <section className="section weather-music-panel">
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
                <span className="weather-step-pitch">{weatherDrivenPitches[index] ?? "C4"}</span>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
};
