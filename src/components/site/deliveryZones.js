export const DELIVERY_ZONES_URL = "/assets/site/delivery-zones.geojson";

export function getDeliveryZonesUrl() {
  const separator = DELIVERY_ZONES_URL.includes("?") ? "&" : "?";
  return `${DELIVERY_ZONES_URL}${separator}updated=${Date.now()}`;
}

export async function loadDeliveryZones() {
  const response = await fetch(getDeliveryZonesUrl(), {
    cache: "no-store",
    headers: {
      Accept: "application/geo+json, application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить карту зон доставки");
  }

  return response.json();
}

export function makeDeliveryZoneLayerStyle(feature) {
  const properties = feature?.properties || {};
  const fill = properties.fill || "#ca7767";
  const stroke = properties.stroke || fill;

  return {
    color: stroke,
    weight: Number(properties["stroke-width"] || 2),
    opacity: Number(properties["stroke-opacity"] || 0.9),
    fillColor: fill,
    fillOpacity: Number(properties["fill-opacity"] || 0.22)
  };
}

export function getDeliveryZoneTitle(feature, index) {
  return feature?.properties?.name || feature?.properties?.description || `Зона ${index + 1}`;
}

export function getDeliveryZonesUpdatedLabel(zones) {
  return zones?.metadata?.updatedAt || zones?.metadata?.updated_at || zones?.metadata?.date || "";
}
