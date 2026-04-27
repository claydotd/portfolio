// Forecasts.tsx
// Fallback 16-day forecast data for every location in WeatherMusic.
// Used when the OpenWeatherMap API is unavailable or times out.

export type ForecastDay = {
    dateLabel: string;
    weatherMain: string;
    weatherDescription: string;
    tempMin: number;
    tempMax: number;
    weatherIcon: string;
  };
  
  type ForecastEntry = { dateLabel: string; weatherMain: string; weatherDescription: string; tempMin: number; tempMax: number };
  
  const withIcons = (days: ForecastEntry[]): ForecastDay[] =>
    days.map((d) => ({ ...d, weatherIcon: iconForMain(d.weatherMain) }));
  
  const iconForMain = (main: string): string => {
    const m = main.toLowerCase();
    if (m.includes("thunder")) return "⛈️";
    if (m.includes("rain") || m.includes("drizzle")) return "🌧️";
    if (m.includes("snow")) return "❄️";
    if (m.includes("mist") || m.includes("fog")) return "🌫️";
    if (m.includes("cloud")) return "☁️";
    if (m.includes("clear")) return "☀️";
    return "🌤️";
  };
  
  // ── Scottish locations  ──────────────────
  
  const EDINBURGH: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "overcast clouds",   tempMin: 3,  tempMax: 8  },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 9  },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7  },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9  },
    { dateLabel: "May 2",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 3,  tempMax: 6  },
    { dateLabel: "May 3",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 3,  tempMax: 9  },
    { dateLabel: "May 5",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 8",  weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -1, tempMax: 3  },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 6  },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 11 },
    { dateLabel: "May 12", weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 4,  tempMax: 7  },
  ]);
  
  const GLASGOW: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 4,  tempMax: 9  },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 5,  tempMax: 10 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 9  },
    { dateLabel: "Apr 30", weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 3,  tempMax: 9  },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 3,  tempMax: 8  },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 11 },
    { dateLabel: "May 7",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 10 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 9  },
  ]);
  
  const DUNDEE: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 3,  tempMax: 9  },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 3,  tempMax: 9  },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 2",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 11 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 3,  tempMax: 10 },
    { dateLabel: "May 5",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 4,  tempMax: 7  },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 7",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 8  },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 8  },
    { dateLabel: "May 10", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -1, tempMax: 4  },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 11 },
  ]);
  
  const ABERDEEN: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 2,  tempMax: 7  },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 7  },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 8  },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 8  },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9  },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 2,  tempMax: 9  },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 5",  weatherMain: "Snow",    weatherDescription: "sleet",              tempMin: 0,  tempMax: 4  },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 2,  tempMax: 6  },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9  },
    { dateLabel: "May 8",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 3,  tempMax: 6  },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 8  },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 3,  tempMax: 9  },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
  ]);
  
  const INVERNESS: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 0,  tempMax: 8  },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 1,  tempMax: 9  },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
    { dateLabel: "Apr 30", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -2, tempMax: 3  },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: -1, tempMax: 8  },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 9  },
    { dateLabel: "May 3",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 2,  tempMax: 6  },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 8  },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 0,  tempMax: 10 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 11 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 2,  tempMax: 9  },
    { dateLabel: "May 9",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 10", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -1, tempMax: 4  },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 1,  tempMax: 7  },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 0,  tempMax: 9  },
  ]);
  
  const STORNOWAY: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 5,  tempMax: 9  },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 6,  tempMax: 9  },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 5,  tempMax: 9  },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 9  },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 6,  tempMax: 10 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 6",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 10 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9  },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 5,  tempMax: 8  },
  ]);
  
  const BENBECULA: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 9  },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 5,  tempMax: 8  },
    { dateLabel: "Apr 29", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 10 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 6,  tempMax: 9  },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 3",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 10 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 11 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 9  },
  ]);
  
  const PORTREE: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 9  },
    { dateLabel: "Apr 28", weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 5,  tempMax: 7  },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 2,  tempMax: 10 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 5",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 5,  tempMax: 7  },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 11 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 9",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 4,  tempMax: 9  },
    { dateLabel: "May 11", weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 5,  tempMax: 8  },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 3,  tempMax: 10 },
  ]);
  
  const KIRKWALL: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 8  },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 4,  tempMax: 8  },
    { dateLabel: "Apr 29", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: 0,  tempMax: 4  },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 8  },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 2,  tempMax: 8  },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 4,  tempMax: 8  },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 5",  weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 3,  tempMax: 6  },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9  },
    { dateLabel: "May 7",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 8  },
    { dateLabel: "May 8",  weatherMain: "Snow",    weatherDescription: "sleet",              tempMin: 0,  tempMax: 4  },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 9  },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 2,  tempMax: 8  },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
  ]);
  
  const LERWICK: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7  },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 7  },
    { dateLabel: "Apr 29", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: 0,  tempMax: 3  },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 6  },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 8  },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 4,  tempMax: 7  },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 3,  tempMax: 6  },
    { dateLabel: "May 6",  weatherMain: "Snow",    weatherDescription: "sleet",              tempMin: 0,  tempMax: 4  },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 2,  tempMax: 6  },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 1,  tempMax: 8  },
    { dateLabel: "May 9",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 3,  tempMax: 7  },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 2,  tempMax: 7  },
    { dateLabel: "May 11", weatherMain: "Mist",    weatherDescription: "mist",               tempMin: 3,  tempMax: 6  },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 3,  tempMax: 7  },
  ]);
  
  // ── Other European cities ────────────────────────────────────────────────────
  
  const LONDON: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 9,  tempMax: 15 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 16 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 9,  tempMax: 15 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 9,  tempMax: 13 },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 9,  tempMax: 13 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 7,  tempMax: 15 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 17 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 9,  tempMax: 16 },
    { dateLabel: "May 5",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 10, tempMax: 14 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 9,  tempMax: 14 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 16 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 18 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 10, tempMax: 17 },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 10, tempMax: 14 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 9,  tempMax: 13 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 15 },
  ]);
  
  const DUBLIN: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 7,  tempMax: 11 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 7,  tempMax: 12 },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 7,  tempMax: 11 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 6,  tempMax: 11 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 5,  tempMax: 13 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 6,  tempMax: 12 },
    { dateLabel: "May 3",  weatherMain: "Drizzle", weatherDescription: "light drizzle",      tempMin: 7,  tempMax: 11 },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 7,  tempMax: 12 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 7,  tempMax: 12 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 5,  tempMax: 14 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 6,  tempMax: 13 },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 7,  tempMax: 11 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 6,  tempMax: 12 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 5,  tempMax: 14 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 6,  tempMax: 12 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 7,  tempMax: 11 },
  ]);
  
  const PARIS: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 20 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 11, tempMax: 19 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 11, tempMax: 16 },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 10, tempMax: 15 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 17 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 20 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 21 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 12, tempMax: 19 },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 11, tempMax: 16 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 10, tempMax: 15 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 18 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 21 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 22 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 20 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 11, tempMax: 17 },
  ]);
  
  const BERLIN: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 7,  tempMax: 14 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 6,  tempMax: 15 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 7,  tempMax: 15 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 8,  tempMax: 12 },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 7,  tempMax: 11 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 6,  tempMax: 14 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 7,  tempMax: 17 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 18 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 9,  tempMax: 17 },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 8,  tempMax: 13 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 7,  tempMax: 12 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 7,  tempMax: 16 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 19 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 20 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 9,  tempMax: 18 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 9,  tempMax: 15 },
  ]);
  
  const MADRID: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 22 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 24 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 22 },
    { dateLabel: "Apr 30", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 23 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 12, tempMax: 19 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 11, tempMax: 17 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 20 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 23 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 25 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 26 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 13, tempMax: 24 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 25 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 27 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 28 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 14, tempMax: 26 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 13, tempMax: 21 },
  ]);
  
  const ROME: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 22 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 24 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 13, tempMax: 22 },
    { dateLabel: "Apr 30", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 23 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 13, tempMax: 19 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 12, tempMax: 18 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 22 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 24 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 25 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 14, tempMax: 23 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 24 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 26 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 27 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 15, tempMax: 25 },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 14, tempMax: 21 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 23 },
  ]);
  
  // ── Americas ─────────────────────────────────────────────────────────────────
  
  const NEW_YORK: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 11, tempMax: 18 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 19 },
    { dateLabel: "Apr 29", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 21 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 12, tempMax: 16 },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 11, tempMax: 15 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 17 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 20 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 22 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 13, tempMax: 21 },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 12, tempMax: 17 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 11, tempMax: 16 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 22 },
    { dateLabel: "May 10", weatherMain: "Thunderstorm", weatherDescription: "thunderstorm",  tempMin: 14, tempMax: 20 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 12, tempMax: 17 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 20 },
  ]);
  
  const NASHVILLE: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 25 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 26 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 16, tempMax: 24 },
    { dateLabel: "Apr 30", weatherMain: "Thunderstorm", weatherDescription: "thunderstorm",  tempMin: 16, tempMax: 22 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 14, tempMax: 20 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 13, tempMax: 20 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 23 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 25 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 26 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 15, tempMax: 24 },
    { dateLabel: "May 7",  weatherMain: "Thunderstorm", weatherDescription: "heavy thunderstorm", tempMin: 16, tempMax: 22 },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 14, tempMax: 19 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 22 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 25 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 16, tempMax: 26 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 27 },
  ]);
  
  const TORONTO: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 6,  tempMax: 12 },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 7,  tempMax: 11 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 6,  tempMax: 12 },
    { dateLabel: "Apr 30", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 5,  tempMax: 14 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 6,  tempMax: 16 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 7,  tempMax: 15 },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 8,  tempMax: 13 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 7,  tempMax: 12 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 6,  tempMax: 15 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 7,  tempMax: 17 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 8,  tempMax: 16 },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 8,  tempMax: 14 },
    { dateLabel: "May 9",  weatherMain: "Thunderstorm", weatherDescription: "thunderstorm",  tempMin: 9,  tempMax: 15 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 8,  tempMax: 14 },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 7,  tempMax: 16 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 18 },
  ]);
  
  const SAO_PAULO: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 16, tempMax: 23 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 16, tempMax: 22 },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 15, tempMax: 21 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 14, tempMax: 21 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 22 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 14, tempMax: 23 },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 15, tempMax: 21 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 14, tempMax: 20 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 21 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 13, tempMax: 22 },
    { dateLabel: "May 7",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 14, tempMax: 20 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 14, tempMax: 21 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 21 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 13, tempMax: 20 },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 14, tempMax: 20 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 21 },
  ]);
  
  const BUENOS_AIRES: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 20 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 19 },
    { dateLabel: "Apr 29", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 20 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 11, tempMax: 17 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 12, tempMax: 16 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 11, tempMax: 15 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 17 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 10, tempMax: 17 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 17 },
    { dateLabel: "May 7",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 10, tempMax: 15 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 10, tempMax: 16 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 17 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 9,  tempMax: 16 },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 10, tempMax: 15 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 8,  tempMax: 16 },
  ]);
  
  // ── Africa ───────────────────────────────────────────────────────────────────
  
  const LAGOS: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Thunderstorm", weatherDescription: "thunderstorm with heavy rain", tempMin: 25, tempMax: 31 },
    { dateLabel: "Apr 28", weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 25, tempMax: 30 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 25, tempMax: 29 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 24, tempMax: 29 },
    { dateLabel: "May 1",  weatherMain: "Thunderstorm", weatherDescription: "thunderstorm",  tempMin: 24, tempMax: 30 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 25, tempMax: 29 },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "heavy rain",         tempMin: 24, tempMax: 28 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 24, tempMax: 28 },
    { dateLabel: "May 5",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 24, tempMax: 29 },
    { dateLabel: "May 6",  weatherMain: "Thunderstorm", weatherDescription: "thunderstorm",  tempMin: 24, tempMax: 29 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 24, tempMax: 28 },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 25, tempMax: 29 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 25, tempMax: 29 },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 24, tempMax: 28 },
    { dateLabel: "May 11", weatherMain: "Thunderstorm", weatherDescription: "thunderstorm with rain", tempMin: 24, tempMax: 28 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 25, tempMax: 29 },
  ]);
  
  const CAPE_TOWN: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 21 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 20 },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 12, tempMax: 18 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 12, tempMax: 17 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 11, tempMax: 18 },
    { dateLabel: "May 3",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 11, tempMax: 16 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 11, tempMax: 16 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 19 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 11, tempMax: 18 },
    { dateLabel: "May 8",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 11, tempMax: 16 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 10, tempMax: 16 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 10, tempMax: 17 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 11, tempMax: 15 },
  ]);
  
  // ── Asia & Pacific ───────────────────────────────────────────────────────────
  
  const TOKYO: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 21 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 22 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 15, tempMax: 22 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 15, tempMax: 21 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 15, tempMax: 19 },
    { dateLabel: "May 2",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 15, tempMax: 18 },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 14, tempMax: 18 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 21 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 22 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 15, tempMax: 21 },
    { dateLabel: "May 7",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 15, tempMax: 20 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 22 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 15, tempMax: 23 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 16, tempMax: 23 },
    { dateLabel: "May 11", weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 16, tempMax: 20 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 15, tempMax: 21 },
  ]);
  
  const SEOUL: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 20 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 19 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 12, tempMax: 18 },
    { dateLabel: "Apr 30", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 12, tempMax: 17 },
    { dateLabel: "May 1",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 12, tempMax: 17 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 21 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 22 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 14, tempMax: 22 },
    { dateLabel: "May 6",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 14, tempMax: 19 },
    { dateLabel: "May 7",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 13, tempMax: 18 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 12, tempMax: 21 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 23 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 14, tempMax: 24 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 14, tempMax: 22 },
    { dateLabel: "May 12", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 14, tempMax: 19 },
  ]);
  
  const MUMBAI: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 34 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 35 },
    { dateLabel: "Apr 29", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 28, tempMax: 34 },
    { dateLabel: "Apr 30", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 34 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 35 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 28, tempMax: 35 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 36 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 36 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 28, tempMax: 35 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 36 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 29, tempMax: 37 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 29, tempMax: 37 },
    { dateLabel: "May 9",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 28, tempMax: 36 },
    { dateLabel: "May 10", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 27, tempMax: 33 },
    { dateLabel: "May 11", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 27, tempMax: 32 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 35 },
  ]);
  
  const DUBAI: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 24, tempMax: 36 },
    { dateLabel: "Apr 28", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 25, tempMax: 37 },
    { dateLabel: "Apr 29", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 25, tempMax: 37 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 26, tempMax: 38 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 26, tempMax: 38 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 26, tempMax: 38 },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 26, tempMax: 37 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 26, tempMax: 39 },
    { dateLabel: "May 5",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 39 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 40 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 40 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 27, tempMax: 39 },
    { dateLabel: "May 9",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 27, tempMax: 39 },
    { dateLabel: "May 10", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 40 },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 28, tempMax: 40 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 27, tempMax: 38 },
  ]);
  
  const SYDNEY: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 13, tempMax: 21 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 13, tempMax: 20 },
    { dateLabel: "Apr 29", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 13, tempMax: 18 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 12, tempMax: 18 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "May 2",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 11, tempMax: 19 },
    { dateLabel: "May 4",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 12, tempMax: 17 },
    { dateLabel: "May 5",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 12, tempMax: 17 },
    { dateLabel: "May 6",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 18 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 11, tempMax: 18 },
    { dateLabel: "May 9",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 11, tempMax: 16 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 10, tempMax: 16 },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 17 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 10, tempMax: 16 },
  ]);
  
  const AUCKLAND: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 12, tempMax: 18 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 12, tempMax: 18 },
    { dateLabel: "Apr 29", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 19 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 12, tempMax: 18 },
    { dateLabel: "May 1",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 12, tempMax: 16 },
    { dateLabel: "May 2",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 12, tempMax: 16 },
    { dateLabel: "May 3",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 11, tempMax: 18 },
    { dateLabel: "May 4",  weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 11, tempMax: 17 },
    { dateLabel: "May 5",  weatherMain: "Rain",    weatherDescription: "light rain",         tempMin: 11, tempMax: 16 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: 11, tempMax: 17 },
    { dateLabel: "May 7",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 10, tempMax: 17 },
    { dateLabel: "May 8",  weatherMain: "Clouds",  weatherDescription: "few clouds",         tempMin: 10, tempMax: 17 },
    { dateLabel: "May 9",  weatherMain: "Rain",    weatherDescription: "moderate rain",      tempMin: 11, tempMax: 15 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: 10, tempMax: 15 },
    { dateLabel: "May 11", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: 9,  tempMax: 16 },
    { dateLabel: "May 12", weatherMain: "Clouds",  weatherDescription: "scattered clouds",   tempMin: 10, tempMax: 15 },
  ]);
  
  // ── Antarctica ───────────────────────────────────────────────────────────────
  
  const MCMURDO: ForecastDay[] = withIcons([
    { dateLabel: "Apr 27", weatherMain: "Snow",    weatherDescription: "moderate snow",      tempMin: -22, tempMax: -12 },
    { dateLabel: "Apr 28", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: -20, tempMax: -10 },
    { dateLabel: "Apr 29", weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -24, tempMax: -14 },
    { dateLabel: "Apr 30", weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: -25, tempMax: -15 },
    { dateLabel: "May 1",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: -28, tempMax: -16 },
    { dateLabel: "May 2",  weatherMain: "Snow",    weatherDescription: "heavy snow",         tempMin: -20, tempMax: -12 },
    { dateLabel: "May 3",  weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: -22, tempMax: -13 },
    { dateLabel: "May 4",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: -30, tempMax: -18 },
    { dateLabel: "May 5",  weatherMain: "Snow",    weatherDescription: "moderate snow",      tempMin: -21, tempMax: -11 },
    { dateLabel: "May 6",  weatherMain: "Clouds",  weatherDescription: "broken clouds",      tempMin: -23, tempMax: -14 },
    { dateLabel: "May 7",  weatherMain: "Snow",    weatherDescription: "light snow",         tempMin: -25, tempMax: -15 },
    { dateLabel: "May 8",  weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: -29, tempMax: -17 },
    { dateLabel: "May 9",  weatherMain: "Snow",    weatherDescription: "heavy snow",         tempMin: -19, tempMax: -10 },
    { dateLabel: "May 10", weatherMain: "Clouds",  weatherDescription: "overcast clouds",    tempMin: -21, tempMax: -12 },
    { dateLabel: "May 11", weatherMain: "Snow",    weatherDescription: "moderate snow",      tempMin: -24, tempMax: -14 },
    { dateLabel: "May 12", weatherMain: "Clear",   weatherDescription: "clear sky",          tempMin: -31, tempMax: -19 },
  ]);
  
  // ── Lookup map ───────────────────────────────────────────────────────────────
  // Keys match the `id` field of each LocationOption in WeatherMusic.tsx.
  
  export const FALLBACK_FORECASTS: Record<string, ForecastDay[]> = {
    "edinburgh-gb":    EDINBURGH,
    "glasgow-gb":      GLASGOW,
    "dundee-gb":       DUNDEE,
    "aberdeen-gb":     ABERDEEN,
    "inverness-gb":    INVERNESS,
    "stornoway-gb":    STORNOWAY,
    "benbecula-gb":    BENBECULA,
    "portree-gb":      PORTREE,
    "kirkwall-gb":     KIRKWALL,
    "lerwick-gb":      LERWICK,
    "london-gb":       LONDON,
    "dublin-ie":       DUBLIN,
    "paris-fr":        PARIS,
    "berlin-de":       BERLIN,
    "madrid-es":       MADRID,
    "rome-it":         ROME,
    "new-york-us":     NEW_YORK,
    "nashville-us":    NASHVILLE,
    "toronto-ca":      TORONTO,
    "sao-paulo-br":    SAO_PAULO,
    "buenos-aires-ar": BUENOS_AIRES,
    "lagos-ng":        LAGOS,
    "cape-town-za":    CAPE_TOWN,
    "tokyo-jp":        TOKYO,
    "seoul-kr":        SEOUL,
    "mumbai-in":       MUMBAI,
    "dubai-ae":        DUBAI,
    "sydney-au":       SYDNEY,
    "auckland-nz":     AUCKLAND,
    "mcmurdo-aq":      MCMURDO,
  };
  
  /** Returns the fallback forecast for the given location id,
   *  falling back to Edinburgh if no specific forecast is found. */
  export const getFallbackForecast = (locationId: string): ForecastDay[] =>
    FALLBACK_FORECASTS[locationId] ?? EDINBURGH;