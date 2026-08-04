// Small shared helpers for relative/absolute date formatting used across the
// Club Dashboard (recent activity feed, training/match lists).

export function timeAgo(timestamp) {
  if (!timestamp) return "";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Tani";
  if (minutes < 60) return `${minutes} min më parë`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} orë më parë`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ditë më parë`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} muaj më parë`;

  const years = Math.floor(months / 12);
  return `${years} vite më parë`;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("sq-AL", { day: "2-digit", month: "short" });
}

export function formatDateFull(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("sq-AL", { day: "2-digit", month: "long", year: "numeric" });
}

export const MONTH_NAMES = [
  "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
  "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
];

export const WEEKDAY_LABELS = ["Hën", "Mar", "Mër", "Enj", "Prem", "Sht", "Die"];
