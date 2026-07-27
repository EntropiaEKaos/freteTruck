import { NextResponse } from "next/server";
import { db } from "@/db";
import { integrationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Config pública de mapas/rastreamento.
 * Retorna apenas chaves marcadas como is_public — nunca expõe segredos de servidor.
 */
export async function GET() {
  const defaults = {
    mapProvider: "openstreetmap",
    googleMapsApiKey: "",
    mapboxAccessToken: "",
    defaultZoom: 4,
    centerLat: -15.7801,
    centerLng: -47.9292,
    trackingEnabled: true,
    trackingIntervalSeconds: 30,
    trackingMode: "browser",
    geocodingProvider: "nominatim",
  };

  try {
    const rows = await db.select().from(integrationSettings).where(eq(integrationSettings.isPublic, true));
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value || ""]));

    return NextResponse.json({
      mapProvider: map.map_provider || defaults.mapProvider,
      googleMapsApiKey: map.google_maps_api_key || "",
      mapboxAccessToken: map.mapbox_access_token || "",
      defaultZoom: parseInt(map.map_default_zoom || "4", 10) || defaults.defaultZoom,
      centerLat: parseFloat(map.map_center_lat || "") || defaults.centerLat,
      centerLng: parseFloat(map.map_center_lng || "") || defaults.centerLng,
      trackingEnabled: (map.tracking_enabled ?? "true") !== "false",
      trackingIntervalSeconds: parseInt(map.tracking_interval_seconds || "30", 10) || 30,
      trackingMode: map.tracking_mode || defaults.trackingMode,
      geocodingProvider: map.geocoding_provider || defaults.geocodingProvider,
      configured: Boolean(map.google_maps_api_key || map.mapbox_access_token) || (map.map_provider || "openstreetmap") === "openstreetmap",
    });
  } catch {
    return NextResponse.json({ ...defaults, configured: true });
  }
}
