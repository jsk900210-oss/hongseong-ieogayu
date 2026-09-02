"use client";

import { useEffect, useState } from "react";

const AREAS = [
  { name: "홍성읍", lat: 36.601, lon: 126.661 }, { name: "광천읍", lat: 36.504, lon: 126.624 },
  { name: "홍북읍", lat: 36.650, lon: 126.680 }, { name: "금마면", lat: 36.612, lon: 126.733 },
  { name: "홍동면", lat: 36.560, lon: 126.688 }, { name: "장곡면", lat: 36.505, lon: 126.691 },
  { name: "은하면", lat: 36.523, lon: 126.589 }, { name: "결성면", lat: 36.526, lon: 126.547 },
  { name: "서부면", lat: 36.581, lon: 126.514 }, { name: "갈산면", lat: 36.602, lon: 126.549 },
  { name: "구항면", lat: 36.580, lon: 126.611 },
];

type WeatherData = { current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number; is_day: number }; daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[] } };

const weatherLabel = (code: number) => {
  if (code === 0) return ["맑음", "☀️"];
  if (code <= 3) return ["구름 조금", "⛅"];
  if (code <= 48) return ["안개", "🌫️"];
  if (code <= 67 || (code >= 80 && code <= 82)) return ["비", "🌧️"];
  if (code <= 77 || (code >= 85 && code <= 86)) return ["눈", "🌨️"];
  if (code >= 95) return ["천둥·번개", "⛈️"];
  return ["날씨 확인", "🌤️"];
};

const weatherEffect = (code: number, wind = 0) => {
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (wind >= 8) return "wind";
  if (code >= 1 && code <= 48) return "cloudy";
  return "clear";
};

const seasonInfo = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return ["spring", "봄"] as const;
  if (month >= 6 && month <= 8) return ["summer", "여름"] as const;
  if (month >= 9 && month <= 11) return ["autumn", "가을"] as const;
  return ["winter", "겨울"] as const;
};

const sunCycle = (weather: WeatherData | null) => {
  if (!weather) return { phase: "day", progress: 0.45 };
  const now = new Date(weather.current.time).getTime();
  const sunrise = new Date(weather.daily.sunrise[0]).getTime();
  const sunset = new Date(weather.daily.sunset[0]).getTime();
  const hour = 60 * 60 * 1000;
  if (now < sunrise - hour || now > sunset + hour) return { phase: "night", progress: 0.5 };
  if (now < sunrise + hour) return { phase: "dawn", progress: Math.max(0, (now - (sunrise - hour)) / (2 * hour)) };
  if (now > sunset - hour) return { phase: "sunset", progress: Math.min(1, (now - (sunset - hour)) / (2 * hour)) };
  return { phase: "day", progress: Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise))) };
};

export default function HongseongWeather() {
  const [area, setArea] = useState(AREAS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ latitude: String(area.lat), longitude: String(area.lon), current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day", daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset", timezone: "Asia/Seoul", forecast_days: "1" });
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("weather"); return response.json(); })
      .then((data: WeatherData) => setWeather(data))
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [area]);

  const [label, icon] = weatherLabel(weather?.current.weather_code ?? -1);
  const [season, seasonLabel] = seasonInfo();
  const effect = weatherEffect(weather?.current.weather_code ?? -1, weather?.current.wind_speed_10m);
  const cycle = sunCycle(weather);
  const celestialLeft = `${92 - cycle.progress * 84}%`;
  const celestialTop = `${70 - Math.sin(cycle.progress * Math.PI) * 57}%`;
  return <>
    <div className={`weather-atmosphere season-${season} weather-${effect} time-${cycle.phase}`} aria-hidden="true"><span className="weather-celestial" style={{ left: celestialLeft, top: cycle.phase === "night" ? "17%" : celestialTop }} />{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--weather-index": index } as React.CSSProperties} />)}</div>
    <div className="hero-weather-wrap">
    <button className="hero-weather" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span className="weather-place">{area.name}<i>지역 변경 ›</i></span>
      {error ? <strong className="weather-error">날씨를 불러오지 못했어요</strong> : weather ? <><span className="weather-main"><b>{Math.round(weather.current.temperature_2m)}°</b><i>{icon}</i></span><span className="weather-summary">{seasonLabel} · {label} · 바람 {Math.round(weather.current.wind_speed_10m)}㎞/h · 체감 {Math.round(weather.current.apparent_temperature)}°</span><span className="weather-range">최고 {Math.round(weather.daily.temperature_2m_max[0])}° · 최저 {Math.round(weather.daily.temperature_2m_min[0])}° · 비 {weather.daily.precipitation_probability_max[0]}%</span></> : <span className="weather-loading">날씨 불러오는 중…</span>}
    </button>
    {open && <div className="weather-picker"><div><b>홍성군 지역별 날씨</b><button type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button></div><p>궁금한 읍·면을 선택해 보세요.</p><div className="weather-area-grid">{AREAS.map((item) => <button type="button" key={item.name} className={area.name === item.name ? "active" : ""} onClick={() => { setWeather(null); setError(false); setArea(item); setOpen(false); }}>{item.name}</button>)}</div><small>날씨 정보 · Open-Meteo</small></div>}
    </div>
  </>;
}
