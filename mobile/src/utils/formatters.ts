export function formatBRL(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "A combinar";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "A combinar";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    const t = kg / 1000;
    return `${t.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ton`;
  }
  return `${kg.toLocaleString("pt-BR")} kg`;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}
