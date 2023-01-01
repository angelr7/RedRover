const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type TIME_UNIT = "minutes" | "hours" | "days" | "weeks";
const TIME_UNITS: TIME_UNIT[] = ["minutes", "hours", "days", "weeks"];

export { DAYS_OF_WEEK, TIME_UNITS };
export type { TIME_UNIT };
