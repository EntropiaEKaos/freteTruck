import type { Freight } from "@/db/schema";
import { calculateANTTFloor, detectCargoCategory } from "@/lib/antt";

export type OpportunityReason = {
  label: string;
  points: number;
  tone: "positive" | "neutral" | "warning";
};

export type OpportunityScore = {
  score: number;
  label: "Excelente" | "Boa" | "Regular" | "Atenção";
  reasons: OpportunityReason[];
  pricePerKm: number | null;
  anttFloor: number | null;
  marginAboveAnttPercent: number | null;
};

export type DriverMatchProfile = {
  state?: string | null;
  vehicleType?: string | null;
  bodyType?: string | null;
};

export function calculateOpportunityScore(
  freight: Freight,
  ownerVerified = false,
  driver?: DriverMatchProfile,
): OpportunityScore {
  let score = 35;
  const reasons: OpportunityReason[] = [];
  const totalPrice = freight.priceType === "total" && freight.price ? Number(freight.price) : null;
  const pricePerKm = totalPrice && freight.distanceKm ? totalPrice / freight.distanceKm : null;

  if (pricePerKm !== null) {
    if (pricePerKm >= 7) {
      score += 22;
      reasons.push({ label: `Boa remuneração: R$ ${pricePerKm.toFixed(2)}/km`, points: 22, tone: "positive" });
    } else if (pricePerKm >= 5) {
      score += 14;
      reasons.push({ label: `Remuneração competitiva: R$ ${pricePerKm.toFixed(2)}/km`, points: 14, tone: "positive" });
    } else {
      score += 3;
      reasons.push({ label: `Valor por km abaixo da referência: R$ ${pricePerKm.toFixed(2)}/km`, points: 3, tone: "warning" });
    }
  } else {
    score += 5;
    reasons.push({ label: "Valor negociável", points: 5, tone: "neutral" });
  }

  let anttFloor: number | null = null;
  let marginAboveAnttPercent: number | null = null;
  if (freight.distanceKm && totalPrice) {
    const floor = calculateANTTFloor(freight.distanceKm, 6, detectCargoCategory(freight.cargoType));
    anttFloor = floor.minPrice;
    marginAboveAnttPercent = ((totalPrice - floor.minPrice) / floor.minPrice) * 100;
    if (totalPrice >= floor.minPrice) {
      score += 12;
      reasons.push({ label: `Acima do piso ANTT em ${Math.max(0, marginAboveAnttPercent).toFixed(0)}%`, points: 12, tone: "positive" });
    } else {
      score -= 12;
      reasons.push({ label: `Abaixo do piso ANTT em ${Math.abs(marginAboveAnttPercent).toFixed(0)}%`, points: -12, tone: "warning" });
    }
  }

  if (ownerVerified) {
    score += 10;
    reasons.push({ label: "Embarcador verificado", points: 10, tone: "positive" });
  }

  if (freight.toll) {
    score += 5;
    reasons.push({ label: "Pedágio incluso", points: 5, tone: "positive" });
  }

  if (driver?.state) {
    if (freight.originState === driver.state) {
      score += 10;
      reasons.push({ label: "Carga saindo do seu estado", points: 10, tone: "positive" });
    } else {
      reasons.push({ label: "Origem fora do seu estado", points: 0, tone: "neutral" });
    }
  }

  if (driver?.vehicleType) {
    const compatible = freight.vehicleTypes.toLowerCase().includes(driver.vehicleType.toLowerCase());
    if (compatible) {
      score += 8;
      reasons.push({ label: `Compatível com ${driver.vehicleType}`, points: 8, tone: "positive" });
    } else {
      score -= 15;
      reasons.push({ label: `Não indica compatibilidade com ${driver.vehicleType}`, points: -15, tone: "warning" });
    }
  }

  if (driver?.bodyType) {
    const compatible = freight.bodyTypes.toLowerCase().includes(driver.bodyType.toLowerCase());
    if (compatible) {
      score += 6;
      reasons.push({ label: `Carroceria ${driver.bodyType} aceita`, points: 6, tone: "positive" });
    } else {
      score -= 10;
      reasons.push({ label: `Carroceria ${driver.bodyType} não listada`, points: -10, tone: "warning" });
    }
  }

  if (freight.needsTracker) {
    reasons.push({ label: "Exige rastreador", points: 0, tone: "neutral" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 82 ? "Excelente" : score >= 68 ? "Boa" : score >= 50 ? "Regular" : "Atenção";

  return { score, label, reasons, pricePerKm, anttFloor, marginAboveAnttPercent };
}
