export const fmt = (n) => n?.toLocaleString("ru-RU") ?? "—";
export const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n);
