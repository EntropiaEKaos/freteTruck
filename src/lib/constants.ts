export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const VEHICLE_TYPES = [
  "Fiorino",
  "VLC",
  "3/4",
  "Toco",
  "Truck",
  "Bitruck",
  "Carreta",
  "Carreta LS",
  "Bitrem",
  "Rodotrem",
  "Vanderleia",
] as const;

export const BODY_TYPES = [
  "Graneleiro",
  "Grade Baixa",
  "Baú",
  "Baú Frigorífico",
  "Sider",
  "Caçamba",
  "Prancha",
  "Tanque",
  "Porta Container",
  "Cegonheiro",
  "Gaiola",
  "Boiadeiro",
] as const;

export const CARGO_TYPES = [
  "Grãos (Soja, Milho, etc)",
  "Fertilizantes",
  "Açúcar",
  "Adubo",
  "Algodão",
  "Bebidas",
  "Carga Geral",
  "Cimento",
  "Combustível",
  "Eletrodomésticos",
  "Frutas e Verduras",
  "Madeira",
  "Máquinas e Equipamentos",
  "Materiais de Construção",
  "Móveis",
  "Produtos Alimentícios",
  "Produtos Químicos",
  "Ração Animal",
  "Veículos",
  "Outros",
] as const;

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

export function timeAgo(date: Date | string): string {
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
