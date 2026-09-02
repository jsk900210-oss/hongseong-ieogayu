import { readFile, writeFile } from "node:fs/promises";

const sources = JSON.parse(await readFile(new URL("../../data/hongseong/festival-sources.json", import.meta.url), "utf8"));
const toIsoDate = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const findDates = (html) => [...html.matchAll(/(20\d{2})\s*[.년\-/]\s*(\d{1,2})\s*[.월\-/]\s*(\d{1,2})/g)]
  .map((match) => toIsoDate(match[1], Number(match[2]), Number(match[3])));

const observations = [];
for (const source of sources) {
  try {
    const response = await fetch(source.sourceUrl, { headers: { "user-agent": "HongseongMateFestivalAgent/1.0" } });
    const html = await response.text();
    const dates = findDates(html);
    observations.push({
      ...source,
      startDate: dates[0] ?? null,
      endDate: dates[1] ?? dates[0] ?? null,
      evidence: dates.length ? `공지에서 확인된 일정: ${dates.slice(0, 2).join(" ~ ")}` : "날짜 형식을 찾지 못해 검수 대기로 보냅니다.",
    });
  } catch (error) {
    observations.push({ ...source, startDate: null, endDate: null, evidence: `출처 확인 실패: ${error instanceof Error ? error.message : "unknown"}` });
  }
}
await writeFile("festival-agent-payload.json", JSON.stringify({ observations }, null, 2));
