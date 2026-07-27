import { NextResponse } from "next/server";
import { calculateANTTFloor, detectCargoCategory, type CargoCategory } from "@/lib/antt";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const distanceKm = parseInt(searchParams.get("distanceKm") || "0", 10);
  const axles = parseInt(searchParams.get("axles") || "6", 10);
  const cargoType = searchParams.get("cargoType") || "";
  const categoryParam = searchParams.get("category") as CargoCategory;

  const category = categoryParam || detectCargoCategory(cargoType);
  const result = calculateANTTFloor(distanceKm || 1000, axles || 6, category);

  return NextResponse.json(result);
}
