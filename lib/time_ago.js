export default function timeAgo(date) {
  const rtf = new Intl.RelativeTimeFormat("th", { numeric: "auto" });
  const diff = (new Date(date) - new Date()) / 1000; // วินาที

  const units = [
    { unit: "year", value: 31536000 },
    { unit: "month", value: 2592000 },
    { unit: "day", value: 86400 },
    { unit: "hour", value: 3600 },
    { unit: "minute", value: 60 },
    { unit: "second", value: 1 },
  ];

  for (let u of units) {
    const delta = diff / u.value;
    if (Math.abs(delta) >= 1) {
      return rtf.format(Math.round(delta), u.unit);
    }
  }
  return "เมื่อสักครู่";
}