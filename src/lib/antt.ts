// Tabela de Piso Mínimo de Frete ANTT (Lei 13.703/2018 atualizada)

export type CargoCategory = "granel_solido" | "granel_liquido" | "frigorificada" | "conteinerizada" | "geral" | "perigosa";

export interface ANTTResult {
  minPrice: number;
  perKm: number;
  fixedCost: number;
  variableCost: number;
  categoryLabel: string;
  axles: number;
}

// Coeficientes médios por categoria de carga (R$/km por eixo e taxa fixa)
const COEFFICIENTS: Record<CargoCategory, { label: string; costPerKmPerAxle: number; baseFixed: number }> = {
  granel_solido: { label: "Granel Sólido (Grãos, Fertilizantes)", costPerKmPerAxle: 0.92, baseFixed: 280 },
  granel_liquido: { label: "Granel Líquido (Combustíveis, Químicos)", costPerKmPerAxle: 1.05, baseFixed: 340 },
  frigorificada: { label: "Carga Frigorificada / Refrigerada", costPerKmPerAxle: 1.12, baseFixed: 390 },
  conteinerizada: { label: "Carga Conteinerizada", costPerKmPerAxle: 0.98, baseFixed: 310 },
  geral: { label: "Carga Geral", costPerKmPerAxle: 0.88, baseFixed: 260 },
  perigosa: { label: "Carga Perigosa", costPerKmPerAxle: 1.25, baseFixed: 450 },
};

export function calculateANTTFloor(
  distanceKm: number,
  axles: number = 6,
  category: CargoCategory = "geral"
): ANTTResult {
  const coef = COEFFICIENTS[category] || COEFFICIENTS.geral;
  const safeDist = Math.max(1, distanceKm);
  const safeAxles = Math.max(2, Math.min(9, axles));

  const variableCost = safeDist * coef.costPerKmPerAxle * safeAxles;
  const fixedCost = coef.baseFixed * (safeAxles / 2);
  const minPrice = Math.round(variableCost + fixedCost);
  const perKm = Math.round((minPrice / safeDist) * 100) / 100;

  return {
    minPrice,
    perKm,
    fixedCost: Math.round(fixedCost),
    variableCost: Math.round(variableCost),
    categoryLabel: coef.label,
    axles: safeAxles,
  };
}

export function detectCargoCategory(cargoType: string): CargoCategory {
  const c = (cargoType || "").toLowerCase();
  if (c.includes("soja") || c.includes("milho") || c.includes("grão") || c.includes("adubo") || c.includes("fertilizante") || c.includes("cimento")) {
    return "granel_solido";
  }
  if (c.includes("combustível") || c.includes("líquido") || c.includes("leite") || c.includes("óleo")) {
    return "granel_liquido";
  }
  if (c.includes("frigo") || c.includes("carne") || c.includes("fruta") || c.includes("verdura") || c.includes("refrigerad")) {
    return "frigorificada";
  }
  if (c.includes("químic") || c.includes("perigos") || c.includes("inflamáv")) {
    return "perigosa";
  }
  if (c.includes("container") || c.includes("contêiner")) {
    return "conteinerizada";
  }
  return "geral";
}
