import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { MAP_CONFIG, RESTAURANT } from "../data/config";

function buildAddress(address = {}, fallback = "") {
  const city = address.city || address.town || address.village || "Чебоксары";
  const road = address.road || address.pedestrian || address.neighbourhood || "";
  const house = address.house_number || "";
  const short = [city, road, house].filter(Boolean).join(", ");
  return short || fallback;
}

export default function MapPicker({ mode, coords, onCoordsChange, onAddressChange, onToast }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const leafletRef = useRef(null);
  const [locating, setLocating] = useState(false);

  const initialCoords = useMemo(() => coords || RESTAURANT.coords, [coords]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const leaflet = await import("leaflet");
      if (cancelled || !mapNode.current || mapRef.current) return;

      leafletRef.current = leaflet;

      const pinIcon = leaflet.divIcon({
        className: "vv-map-pin",
        html: "<span></span>",
        iconSize: [34, 44],
        iconAnchor: [17, 42]
      });

      const restaurantIcon = leaflet.divIcon({
        className: "vv-restaurant-pin",
        html: "<span>ВВ</span>",
        iconSize: [42, 42],
        iconAnchor: [21, 38]
      });

      const map = leaflet
        .map(mapNode.current, {
          zoomControl: false,
          attributionControl: true,
          dragging: true,
          tap: true
        })
        .setView([initialCoords.lat, initialCoords.lng], MAP_CONFIG.defaultZoom);

      leaflet
        .tileLayer(MAP_CONFIG.tileUrl, {
          attribution: MAP_CONFIG.attribution,
          maxZoom: 19
        })
        .addTo(map);

      restaurantMarkerRef.current = leaflet
        .marker([RESTAURANT.coords.lat, RESTAURANT.coords.lng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`${RESTAURANT.name}<br>${RESTAURANT.address}`);

      markerRef.current = leaflet
        .marker([initialCoords.lat, initialCoords.lng], {
          draggable: mode === "delivery",
          icon: pinIcon
        })
        .addTo(map);

      markerRef.current.on("dragend", () => {
        const next = markerRef.current.getLatLng();
        handlePoint(next);
      });

      map.on("click", (event) => {
        if (mode !== "delivery") return;
        markerRef.current.setLatLng(event.latlng);
        handlePoint(event.latlng);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 120);
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, [initialCoords.lat, initialCoords.lng, mode]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const nextCoords = mode === "pickup" ? RESTAURANT.coords : coords || RESTAURANT.coords;
    markerRef.current.setLatLng([nextCoords.lat, nextCoords.lng]);
    markerRef.current.dragging?.[mode === "delivery" ? "enable" : "disable"]();
    mapRef.current.setView(
      [nextCoords.lat, nextCoords.lng],
      mode === "pickup" ? MAP_CONFIG.pickupZoom : MAP_CONFIG.deliveryZoom
    );

    setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [mode, coords]);

  async function reverseGeocode(point) {
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(point.lat),
        lon: String(point.lng),
        "accept-language": "ru"
      });

      const response = await fetch(`${MAP_CONFIG.reverseGeocodeUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      return buildAddress(data.address, data.display_name);
    } catch {
      onToast("Не удалось определить адрес. Можно ввести улицу и дом вручную.");
      return "";
    }
  }

  async function handlePoint(point) {
    const next = {
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6))
    };
    onCoordsChange(next);

    if (mode === "delivery") {
      const address = await reverseGeocode(next);
      if (address) onAddressChange(address);
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      onToast("Геопозиция не поддерживается этим браузером.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        markerRef.current?.setLatLng([next.lat, next.lng]);
        mapRef.current?.setView([next.lat, next.lng], MAP_CONFIG.deliveryZoom);
        handlePoint(next);
        setLocating(false);
      },
      () => {
        onToast("Геопозиция не разрешена. Выберите точку на карте или введите адрес.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
  }

  return (
    <div className="map-shell">
      <div ref={mapNode} className="map-canvas" aria-label="Карта Чебоксар" />
      <div className="map-card">
        <MapPin size={18} />
        <span>{mode === "pickup" ? "Точка самовывоза на Пирогова, 1Т" : "Кликните по дому или перетащите пин"}</span>
      </div>
      {mode === "delivery" ? (
        <button className="map-locate" type="button" onClick={locateMe} disabled={locating}>
          <LocateFixed size={18} />
          {locating ? "Ищем..." : "Моё местоположение"}
        </button>
      ) : null}
    </div>
  );
}
