import dayjs from "dayjs";

import type { ICalendarEvent } from "@/app/shifts/ShiftsCalendar";
import { formatTime } from "@/utils/formatDateTime";
import {
  formatHourLabel,
  getHourMarks,
  getTimeAxis,
  packDayLanes,
} from "@/utils/scheduleTimeGrid";

// Builds a self-contained, printable HTML document of a volunteer's schedule in
// the time-grid calendar format. Opened in a new window and auto-printed, so it
// carries no site chrome. Renders the single event week only, matching the
// on-screen account calendar — PEERS schedules one week in August (per papabear
// 2026-07-22).

const PX_PER_HOUR = 56;
const GUTTER_WIDTH = 52;
const DAY_COUNT = 5; // Mon–Fri

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Monday of the week containing `date` (startOf week is Sunday, so +1 day).
const mondayOf = (date: string) =>
  dayjs(date).startOf("week").add(1, "day").format("YYYY-MM-DD");

export const buildSchedulePrintHtml = ({
  events,
  title,
}: {
  events: ICalendarEvent[];
  title: string;
}): string => {
  const { startMin, endMin } = getTimeAxis(events);
  const hourMarks = getHourMarks(startMin, endMin);
  const gridHeight = ((endMin - startMin) / 60) * PX_PER_HOUR;

  // Single event week only — the Monday of the earliest shift's week — to match
  // the on-screen account calendar (no navigation).
  const earliest = events.map((e) => e.date).sort()[0];
  const weekStarts = earliest ? [mondayOf(earliest)] : [];

  const hourLabels = hourMarks
    .map((hour) => {
      const top = ((hour * 60 - startMin) / 60) * PX_PER_HOUR - 7;
      return `<div class="hour-label" style="top:${top}px">${formatHourLabel(
        hour
      )}</div>`;
    })
    .join("");

  const hourLines = hourMarks
    .map((hour) => {
      const top = ((hour * 60 - startMin) / 60) * PX_PER_HOUR;
      return `<div class="hour-line" style="top:${top}px"></div>`;
    })
    .join("");

  const weeksHtml = weekStarts
    .map((weekStart) => {
      const monday = dayjs(weekStart);
      const weekLabel = `${monday.format("MMM D")} – ${monday
        .add(DAY_COUNT - 1, "day")
        .format("MMM D, YYYY")}`;

      const dayHeaders = Array.from({ length: DAY_COUNT }, (_, i) => {
        const day = monday.add(i, "day");
        return `<div class="day-header"><div class="dow">${day.format(
          "ddd"
        )}</div><div class="dom">${day.format("M/D")}</div></div>`;
      }).join("");

      const dayColumns = Array.from({ length: DAY_COUNT }, (_, i) => {
        const day = monday.add(i, "day");
        const dayEvents = events.filter((e) =>
          dayjs(e.date).isSame(day, "day")
        );
        const { placed, laneCount } = packDayLanes(dayEvents);

        const blocks = placed
          .map(({ event, lane, startMin: s, endMin: en }) => {
            const top = ((s - startMin) / 60) * PX_PER_HOUR;
            const height = Math.max(((en - s) / 60) * PX_PER_HOUR, 22);
            const widthPct = 100 / laneCount;
            const left = lane * widthPct;
            const canceled = event.canceled ? " canceled" : "";
            return `<div class="block${canceled}" style="top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${widthPct}% - 4px);border-color:${
              event.color
            };background:${event.color}22">
              <div class="block-time">${escapeHtml(
                formatTime(event.startTime, event.endTime)
              )}</div>
              <div class="block-type">${escapeHtml(event.type)}</div>
              ${event.canceled ? '<div class="block-canceled">CANCELED</div>' : ""}
            </div>`;
          })
          .join("");

        return `<div class="day-col" style="height:${gridHeight}px">${hourLines}${blocks}</div>`;
      }).join("");

      return `<section class="week">
        <h2 class="week-label">${weekLabel}</h2>
        <div class="grid header-grid">
          <div class="gutter-head"></div>
          ${dayHeaders}
        </div>
        <div class="grid body-grid">
          <div class="gutter" style="height:${gridHeight}px">${hourLabels}</div>
          ${dayColumns}
        </div>
      </section>`;
    })
    .join("");

  const emptyState =
    weekStarts.length === 0
      ? '<p class="empty">You have no scheduled shifts.</p>'
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: landscape; margin: 1cm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #2b2b2b;
    margin: 24px;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitle { color: #666; font-size: 12px; margin: 0 0 20px; }
  .empty { color: #666; font-size: 14px; }
  .week { margin-bottom: 28px; page-break-inside: avoid; }
  .week-label {
    font-size: 15px;
    text-align: center;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 6px;
    margin: 0 0 8px;
  }
  .grid {
    display: grid;
    grid-template-columns: ${GUTTER_WIDTH}px repeat(${DAY_COUNT}, 1fr);
    gap: 6px;
  }
  .header-grid { margin-bottom: 6px; }
  .gutter-head {}
  .day-header {
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: center;
    padding: 4px;
    background: rgba(0,0,0,0.02);
  }
  .day-header .dow { font-size: 11px; color: #666; }
  .day-header .dom { font-size: 13px; font-weight: 700; }
  .gutter { position: relative; }
  .hour-label {
    position: absolute;
    right: 4px;
    font-size: 10px;
    color: #666;
  }
  .day-col {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
  }
  .hour-line {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px solid #eee;
  }
  .block {
    position: absolute;
    border: 1px solid #999;
    border-radius: 4px;
    padding: 3px 4px;
    overflow: hidden;
    font-size: 10px;
  }
  .block-time { font-weight: 700; }
  .block-type { }
  .block.canceled .block-time, .block.canceled .block-type {
    text-decoration: line-through;
  }
  .block-canceled { color: #c00; font-weight: 700; }
</style>
</head>
<body onload="window.print()">
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">Printed from PEERS &middot; volunteers.peers.burningman.org</p>
  ${emptyState}
  ${weeksHtml}
</body>
</html>`;
};
