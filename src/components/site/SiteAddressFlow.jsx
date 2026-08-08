import { Clock3, LocateFixed, MapPin, Navigation, Search, Store, Truck, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DELIVERY_MIN_ORDER_AMOUNT } from "../../../shared/order-rules";
import { MAP_CONFIG } from "../../data/config";
import { formatPrice } from "../../utils/price";
import { loadDeliveryZones, makeDeliveryZoneLayerStyle } from "./deliveryZones";
import { DELIVERY_STORAGE_KEY, RESTAURANT } from "./siteData";

const emptyFulfillment = {
  mode: "delivery",
  address: "",
  coords: null,
  entrance: "",
  code: "",
  flat: "",
  floor: "",
  addressComment: ""
};

function normalizeFulfillment(fulfillment = {}) {
  return {
    ...emptyFulfillment,
    ...fulfillment,
    mode: fulfillment.mode === "pickup" ? "pickup" : "delivery"
  };
}

function stripCityFromAddress(value = "") {
  return String(value)
    .replace(/^\s*(?:г(?:ород)?\.?\s*)?Чебоксары\s*,?\s*/i, "")
    .trimStart();
}

export function readSiteFulfillment() {
  if (typeof window === "undefined") return normalizeFulfillment();

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    return normalizeFulfillment(parsedState.fulfillment);
  } catch {
    return normalizeFulfillment();
  }
}

export function saveSiteFulfillment(fulfillment) {
  if (typeof window === "undefined") return normalizeFulfillment(fulfillment);

  const nextFulfillment = normalizeFulfillment(fulfillment);

  try {
    const parsedState = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}");
    window.localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({ ...parsedState, fulfillment: nextFulfillment })
    );
  } catch {
    window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify({ fulfillment: nextFulfillment }));
  }

  return nextFulfillment;
}

function buildAddress(address = {}, fallback = "") {
  const city = address.city || address.town || address.village || "Чебоксары";
  const road = address.road || address.pedestrian || address.neighbourhood || "";
  const house = address.house_number || "";
  return stripCityFromAddress([city, road, house].filter(Boolean).join(", ") || fallback);
}

function pointInRing(point, ring) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInGeometry(point, geometry) {
  if (!point || !geometry) return false;

  if (geometry.type === "Polygon") {
    const [outerRing, ...holes] = geometry.coordinates || [];
    if (!outerRing || !pointInRing(point, outerRing)) return false;
    return !holes.some((ring) => pointInRing(point, ring));
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(([outerRing, ...holes]) => {
      if (!outerRing || !pointInRing(point, outerRing)) return false;
      return !holes.some((ring) => pointInRing(point, ring));
    });
  }

  return false;
}

function getZoneForPoint(point, zones) {
  if (!point || !Array.isArray(zones?.features)) return null;
  return zones.features.find((feature) => pointInGeometry(point, feature.geometry)) || null;
}

function makeZoneStatus(point, zones) {
  if (!point) return { checked: false, inZone: false, label: "Поставьте пин на карте" };

  const zone = getZoneForPoint(point, zones);

  if (!zones?.features?.length) {
    return { checked: true, inZone: true, label: "Зона доставки загружается" };
  }

  if (zone) {
    return { checked: true, inZone: true, label: "Адрес в зоне доставки" };
  }

  return { checked: true, inZone: false, label: "Адрес вне зоны доставки" };
}

export function SiteAddressPrompt({ onClose, onDelivery, onPickup, onLogin }) {
  const closeOnPointerDown = (event) => {
    event.preventDefault();
    onClose();
  };

  return (
    <div className="site-address-prompt-layer" role="presentation">
      <div
        className="site-address-prompt-scrim"
        aria-label="Закрыть выбор адреса"
        aria-hidden="true"
        onPointerDown={closeOnPointerDown}
        onClick={onClose}
      />
      <section className="site-address-prompt" role="dialog" aria-modal="true" aria-labelledby="site-address-prompt-title">
        <button
          className="site-address-prompt-close"
          type="button"
          aria-label="Закрыть"
          onPointerDown={closeOnPointerDown}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h2 id="site-address-prompt-title">Какой у вас адрес?</h2>
        <p>
          Проверим зону. Бесплатная доставка от {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок,
          самовывоз без минимальной суммы.
        </p>
        <button className="site-address-primary" type="button" onClick={onDelivery}>
          <Truck size={18} />
          Указать адрес доставки
        </button>
        <button className="site-address-secondary" type="button" onClick={onPickup}>
          <Store size={18} />
          Забрать из пиццерии
        </button>
        <span>
          Уже есть аккаунт?
          <button type="button" onClick={onLogin}>
            <UserRound size={15} />
            Войти
          </button>
        </span>
      </section>
    </div>
  );
}

function SiteZoneMap({ draft, mode, onDraftChange, onZoneStatusChange, onMessage }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const pizzeriaMarkerRef = useRef(null);
  const zonesRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const modeRef = useRef(mode);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const leaflet = await import("leaflet");
      if (cancelled || !mapNodeRef.current || mapRef.current) return;

      leafletRef.current = leaflet;

      const pinIcon = leaflet.divIcon({
        className: "site-address-pin",
        html: "<span></span>",
        iconSize: [34, 44],
        iconAnchor: [17, 42]
      });
      const pizzeriaIcon = leaflet.divIcon({
        className: "site-address-pizzeria-pin",
        html: '<span><img src="/assets/site/vv-map-logo.svg" alt="" /></span>',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      const startCoords = draft.coords || RESTAURANT.coords;
      const map = leaflet
        .map(mapNodeRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          tap: true
        })
        .setView([startCoords.lat, startCoords.lng], MAP_CONFIG.defaultZoom);

      leaflet
        .tileLayer(MAP_CONFIG.tileUrl, {
          attribution: "",
          maxZoom: 19
        })
        .addTo(map);

      leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      pizzeriaMarkerRef.current = leaflet
        .marker([RESTAURANT.coords.lat, RESTAURANT.coords.lng], { icon: pizzeriaIcon, zIndexOffset: 220 })
        .addTo(map)
        .bindPopup(`${RESTAURANT.name}<br>${RESTAURANT.address}`);

      markerRef.current = leaflet
        .marker([startCoords.lat, startCoords.lng], {
          draggable: modeRef.current === "delivery",
          icon: pinIcon,
          zIndexOffset: 300
        })
        .addTo(map);
      markerRef.current.setOpacity(modeRef.current === "delivery" ? 1 : 0);

      markerRef.current.on("dragend", () => {
        const point = markerRef.current.getLatLng();
        handlePoint({ lat: point.lat, lng: point.lng }, true);
      });

      map.on("click", (event) => {
        if (modeRef.current !== "delivery") return;
        markerRef.current.setLatLng(event.latlng);
        handlePoint({ lat: event.latlng.lat, lng: event.latlng.lng }, true);
      });

      mapRef.current = map;

      try {
        const zones = await loadDeliveryZones();
        if (cancelled) return;

        zonesRef.current = zones;
        zoneLayerRef.current = leaflet
          .geoJSON(zones, {
            style: makeDeliveryZoneLayerStyle,
            interactive: false
          })
          .addTo(map);

        if (modeRef.current === "pickup") {
          map.setView([RESTAURANT.coords.lat, RESTAURANT.coords.lng], MAP_CONFIG.pickupZoom);
        } else {
          map.fitBounds(zoneLayerRef.current.getBounds(), { padding: [34, 34] });
        }
        onZoneStatusChange(makeZoneStatus(draft.coords, zones));
      } catch {
        onMessage("Не удалось загрузить зоны доставки. Попробуйте обновить страницу.");
      }

      setTimeout(() => map.invalidateSize(), 120);
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const nextCoords = mode === "pickup" ? RESTAURANT.coords : draft.coords || RESTAURANT.coords;
    markerRef.current.setLatLng([nextCoords.lat, nextCoords.lng]);
    markerRef.current.setOpacity(mode === "delivery" ? 1 : 0);
    markerRef.current.dragging?.[mode === "delivery" ? "enable" : "disable"]();

    if (mode === "pickup") {
      mapRef.current.setView([RESTAURANT.coords.lat, RESTAURANT.coords.lng], MAP_CONFIG.pickupZoom);
    } else if (draft.coords) {
      mapRef.current.setView([draft.coords.lat, draft.coords.lng], MAP_CONFIG.deliveryZoom);
    } else if (zoneLayerRef.current) {
      mapRef.current.fitBounds(zoneLayerRef.current.getBounds(), { padding: [34, 34] });
    }

    onZoneStatusChange(makeZoneStatus(mode === "pickup" ? RESTAURANT.coords : draft.coords, zonesRef.current));
    setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [draft.coords, mode, onZoneStatusChange]);

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
      onMessage("Не удалось определить адрес. Можно ввести улицу и дом вручную.");
      return "";
    }
  }

  async function handlePoint(point, shouldReverseGeocode) {
    const coords = {
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6))
    };
    const nextDraft = { ...draft, coords };

    if (shouldReverseGeocode) {
      const address = await reverseGeocode(coords);
      if (address) nextDraft.address = address;
    }

    onDraftChange(nextDraft);
    onZoneStatusChange(makeZoneStatus(coords, zonesRef.current));
  }

  function locateMe() {
    if (!navigator.geolocation) {
      onMessage("Геопозиция не поддерживается этим браузером.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        markerRef.current?.setLatLng([coords.lat, coords.lng]);
        mapRef.current?.setView([coords.lat, coords.lng], MAP_CONFIG.deliveryZoom);
        handlePoint(coords, true);
        setLocating(false);
      },
      () => {
        onMessage("Геопозиция не разрешена. Выберите точку на карте или введите адрес.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
  }

  return (
    <div className="site-address-map-shell">
      <div ref={mapNodeRef} className="site-address-map" aria-label="Карта зоны доставки" />
      <button className="site-address-locate" type="button" onClick={locateMe} disabled={mode === "pickup" || locating}>
        <LocateFixed size={18} />
        {locating ? "Ищем..." : "Где я"}
      </button>
      <div className="site-address-map-note">
        <MapPin size={17} />
        <span>{mode === "pickup" ? "Самовывоз на Пирогова, 1Т" : "Кликните по дому или перетащите пин"}</span>
      </div>
    </div>
  );
}

export function SiteAddressModal({
  initialFulfillment,
  onClose,
  onSave,
  deliveryTitle = "Укажите адрес доставки",
  deliveryLead = "Цены, меню и доступность зависят от адреса.",
  deliverySubmitLabel = "Заказать сюда"
}) {
  const [draft, setDraft] = useState(() => {
    const normalizedInitial = normalizeFulfillment(initialFulfillment);
    if (normalizedInitial.mode !== "pickup") return normalizedInitial;

    return normalizeFulfillment({
      mode: "pickup",
      address: RESTAURANT.address,
      coords: RESTAURANT.coords
    });
  });
  const [mode, setMode] = useState(() => normalizeFulfillment(initialFulfillment).mode);
  const [zoneStatus, setZoneStatus] = useState(() => makeZoneStatus(initialFulfillment?.coords, null));
  const [message, setMessage] = useState("");
  const requiredDeliveryFieldsFilled = Boolean(draft.entrance.trim() && draft.floor.trim() && draft.flat.trim());
  const normalizedDraftAddress = stripCityFromAddress(draft.address).trim();
  const canSaveDelivery =
    mode === "delivery" && normalizedDraftAddress && draft.coords && zoneStatus.inZone && requiredDeliveryFieldsFilled;

  const closeOnPointerDown = (event) => {
    event.preventDefault();
    onClose();
  };

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 3200);
    return () => clearTimeout(timer);
  }, [message]);

  const pickupFulfillment = useMemo(
    () =>
      normalizeFulfillment({
        mode: "pickup",
        address: RESTAURANT.address,
        coords: RESTAURANT.coords
      }),
    []
  );

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const setDeliveryMode = () => {
    setMode("delivery");
    setDraft((current) => normalizeFulfillment({ ...current, mode: "delivery" }));
  };

  const setPickupMode = () => {
    setMode("pickup");
    setDraft(pickupFulfillment);
  };

  async function searchAddress() {
    const addressForSearch = stripCityFromAddress(draft.address);

    if (!addressForSearch.trim()) {
      setMessage("Введите улицу и дом.");
      return;
    }

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        q: `Чебоксары, ${addressForSearch}`,
        limit: "1",
        "accept-language": "ru"
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) throw new Error("Address search failed");
      const [result] = await response.json();

      if (!result) {
        setMessage("Не нашли адрес. Поставьте пин на карте вручную.");
        return;
      }

      setDraft((current) => ({
        ...current,
        address: buildAddress(result.address, result.display_name),
        coords: {
          lat: Number(result.lat),
          lng: Number(result.lon)
        }
      }));
    } catch {
      setMessage("Поиск адреса не сработал. Можно поставить пин на карте.");
    }
  }

  function saveDelivery() {
    if (mode === "pickup") {
      onSave(pickupFulfillment);
      return;
    }

    if (!normalizedDraftAddress) {
      setMessage("Введите адрес доставки.");
      return;
    }

    const missingFields = [
      !draft.entrance.trim() ? "подъезд" : "",
      !draft.floor.trim() ? "этаж" : "",
      !draft.flat.trim() ? "квартира" : ""
    ].filter(Boolean);

    if (missingFields.length) {
      setMessage(`Заполните обязательные поля: ${missingFields.join(", ")}.`);
      return;
    }

    if (!draft.coords) {
      setMessage("Поставьте пин на карте или найдите адрес.");
      return;
    }

    if (!zoneStatus.inZone) {
      setMessage("Этот адрес пока вне зоны доставки. Можно выбрать самовывоз.");
      return;
    }

    onSave(normalizeFulfillment({ ...draft, mode: "delivery", address: normalizedDraftAddress }));
  }

  return (
    <div className="site-address-modal-layer" role="presentation">
      <div
        className="site-address-modal-scrim"
        aria-label="Закрыть карту"
        aria-hidden="true"
        onPointerDown={closeOnPointerDown}
        onClick={onClose}
      />
      <section className="site-address-modal" role="dialog" aria-modal="true" aria-labelledby="site-address-modal-title">
        <button
          className="site-address-modal-close"
          type="button"
          aria-label="Закрыть"
          onPointerDown={closeOnPointerDown}
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <div className="site-address-mode-tabs" role="tablist" aria-label="Способ получения">
          <button className={mode === "delivery" ? "is-active" : ""} type="button" onClick={setDeliveryMode}>
            <Truck size={17} />
            Доставка
          </button>
          <button className={mode === "pickup" ? "is-active" : ""} type="button" onClick={setPickupMode}>
            <Store size={17} />
            Самовывоз
          </button>
        </div>

        <SiteZoneMap
          draft={draft}
          mode={mode}
          onDraftChange={setDraft}
          onZoneStatusChange={setZoneStatus}
          onMessage={setMessage}
        />

        <div className="site-address-panel">
          {mode === "delivery" ? (
            <>
              <h2 id="site-address-modal-title">{deliveryTitle}</h2>
              <p>{deliveryLead}</p>
              <label className="site-address-field site-address-field-wide">
                <span>Улица и дом</span>
                <div className="site-address-search">
                  <input
                    value={stripCityFromAddress(draft.address)}
                    onChange={(event) => updateField("address", stripCityFromAddress(event.target.value))}
                    placeholder="Московский проспект, 16"
                    title={stripCityFromAddress(draft.address)}
                  />
                  <button type="button" onClick={searchAddress} aria-label="Найти адрес">
                    <Search size={18} />
                  </button>
                </div>
              </label>
              <div className={`site-address-zone-status ${zoneStatus.inZone ? "is-ok" : "is-bad"}`}>
                <Navigation size={17} />
                {zoneStatus.label}
              </div>
              <div className="site-address-grid">
                <label className="site-address-field">
                  <span>
                    Подъезд <b className="site-address-required">*</b>
                  </span>
                  <input
                    value={draft.entrance}
                    onChange={(event) => updateField("entrance", event.target.value)}
                    required
                    aria-required="true"
                  />
                </label>
                <label className="site-address-field">
                  <span>Код двери</span>
                  <input value={draft.code} onChange={(event) => updateField("code", event.target.value)} />
                </label>
                <label className="site-address-field">
                  <span>
                    Этаж <b className="site-address-required">*</b>
                  </span>
                  <input
                    value={draft.floor}
                    onChange={(event) => updateField("floor", event.target.value)}
                    required
                    aria-required="true"
                  />
                </label>
                <label className="site-address-field">
                  <span>
                    Квартира <b className="site-address-required">*</b>
                  </span>
                  <input
                    value={draft.flat}
                    onChange={(event) => updateField("flat", event.target.value)}
                    required
                    aria-required="true"
                  />
                </label>
              </div>
              <label className="site-address-field site-address-field-wide">
                <span>Комментарий к адресу</span>
                <input
                  value={draft.addressComment}
                  onChange={(event) => updateField("addressComment", event.target.value)}
                  placeholder="Домофон, ориентир, как найти подъезд"
                />
              </label>
            </>
          ) : (
            <div className="site-address-pickup-panel">
              <label className="site-address-pickup-search">
                <span>Район, улица или станция метро</span>
                <input value="" placeholder="Пирогова, 1Т" readOnly />
              </label>
              <p className="site-address-pickup-hint">Цены, меню и акции зависят от выбранной точки.</p>
              <div className="site-address-pickup-list" role="list">
                <button className="site-address-pickup-row is-selected" type="button" role="listitem">
                  <span className="site-address-pickup-dot" aria-hidden="true" />
                  <span>
                    <b>{RESTAURANT.shortAddress}</b>
                    <em>Открыто до 22:00</em>
                  </span>
                </button>
              </div>
              <div className="site-address-pickup-card">
                <div>
                  <Store size={18} />
                  <span>Пиццерия</span>
                  <b>ежедневно {RESTAURANT.workHours}</b>
                </div>
                <div>
                  <Truck size={18} />
                  <span>Доставка</span>
                  <b>ежедневно {RESTAURANT.workHours}</b>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>Самовывоз</span>
                  <b>{RESTAURANT.pickupEta}</b>
                </div>
              </div>
            </div>
          )}

          {message ? <div className="site-address-message">{message}</div> : null}

          <button
            className="site-address-submit"
            type="button"
            onClick={saveDelivery}
            disabled={mode === "delivery" && !canSaveDelivery}
          >
            {mode === "pickup" ? "Выбрать самовывоз" : deliverySubmitLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
