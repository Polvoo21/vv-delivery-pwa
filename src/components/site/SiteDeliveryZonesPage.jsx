import "../../styles/site/delivery-zones.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { DELIVERY_MIN_ORDER_AMOUNT } from "../../../shared/order-rules";
import { MAP_CONFIG } from "../../data/config";
import { formatPrice } from "../../utils/price";
import {
  loadDeliveryZones,
  makeDeliveryZoneLayerStyle
} from "./deliveryZones";
import { RESTAURANT } from "./siteData";
import { SiteFooter } from "./SiteFooter";
import { SitePublicShell } from "./SitePublicShell";

function SiteDeliveryZonesMap({ zones, onError }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const zoneLayerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const [leaflet] = await Promise.all([
        import("leaflet"),
        import("leaflet/dist/leaflet.css")
      ]);
      if (cancelled || !mapNodeRef.current || mapRef.current) return;

      const pizzeriaIcon = leaflet.divIcon({
        className: "site-delivery-zones-pizzeria-pin",
        html: '<span><img src="/assets/site/vv-map-logo.svg" alt="" /></span>',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      const map = leaflet
        .map(mapNodeRef.current, {
          zoomControl: true,
          attributionControl: false,
          dragging: true,
          tap: true
        })
        .setView([RESTAURANT.coords.lat, RESTAURANT.coords.lng], MAP_CONFIG.defaultZoom);

      leaflet
        .tileLayer(MAP_CONFIG.tileUrl, {
          attribution: "",
          maxZoom: 19
        })
        .addTo(map);

      leaflet
        .marker([RESTAURANT.coords.lat, RESTAURANT.coords.lng], { icon: pizzeriaIcon, zIndexOffset: 240 })
        .addTo(map)
        .bindPopup(`${RESTAURANT.name}<br>${RESTAURANT.address}`);

      zoneLayerRef.current = leaflet
        .geoJSON(zones, {
          style: makeDeliveryZoneLayerStyle,
          interactive: false
        })
        .addTo(map);

      mapRef.current = map;

      const bounds = zoneLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [34, 34] });
      }

      setTimeout(() => map.invalidateSize(), 120);
    }

    initMap().catch(() => onError?.("Не удалось открыть карту. Попробуйте обновить страницу."));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [zones, onError]);

  return <div className="site-delivery-zones-map" ref={mapNodeRef} aria-label="Карта зон доставки" />;
}

export function SiteDeliveryZonesPage() {
  const [zones, setZones] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    window.document.title = "Зоны доставки | Вместе Вкуснее";
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadDeliveryZones()
      .then((nextZones) => {
        if (cancelled) return;
        setZones(nextZones);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(error.message || "Не удалось загрузить зоны доставки");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const zonesList = useMemo(() => (Array.isArray(zones?.features) ? zones.features : []), [zones]);
  const zoneLegendColors = useMemo(
    () => {
      const colors = zonesList
        .map((zone) => zone.properties?.fill || "#ca7767")
        .filter((color, index, list) => color && list.indexOf(color) === index)
        .slice(0, 3);

      return colors.length ? colors : ["#ca7767", "#ef4444", "#2f9bff"];
    },
    [zonesList]
  );

  return (
    <SitePublicShell className="site-delivery-zones-page">
      <section className="site-delivery-zones-hero">
        <p>Доставка</p>
        <h1>Актуальные зоны доставки</h1>
        <span>
          Показываем районы Чебоксар, куда сейчас привозим заказы. В отмеченных зонах доставка бесплатная
          при сумме заказа от {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок.
        </span>
        <div>
          <b>
            <MapPin size={16} />
            Самовывоз: {RESTAURANT.shortAddress}
          </b>
          <b className="site-delivery-zones-legend-chip">
            <span aria-hidden="true">
              {zoneLegendColors.map((color) => (
                <i key={color} style={{ backgroundColor: color }} />
              ))}
            </span>
            Зоны бесплатной доставки
          </b>
        </div>
      </section>

      <section className="site-delivery-zones-layout">
        <div className="site-delivery-zones-map-card">
          {status === "ready" && zones ? (
            <SiteDeliveryZonesMap zones={zones} onError={setMessage} />
          ) : (
            <div className="site-delivery-zones-map-state">
              <Navigation size={22} />
              <span>{status === "error" ? message : "Загружаем карту зон доставки"}</span>
            </div>
          )}
        </div>

        <aside className="site-delivery-zones-info">
          <h2>Как это работает</h2>
          <p>
            Укажите адрес при заказе, и мы сразу покажем, доступна ли доставка. В отмеченных зонах она бесплатная
            при заказе от {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок. Если адрес вне карты или сумма
            меньше, можно выбрать самовывоз с Пирогова, 1Т без минимальной суммы.
          </p>
          <ul>
            <li>Минимальная сумма бесплатной доставки — {formatPrice(DELIVERY_MIN_ORDER_AMOUNT)} ₽ после скидок.</li>
            <li>Точное время доставки показывается в корзине и на странице оформления.</li>
            <li>Самовывоз доступен по адресу Пирогова, 1Т без минимальной суммы.</li>
            <li>Зоны могут меняться из-за загрузки кухни, погоды и дорожной ситуации.</li>
          </ul>
          {zonesList.length ? (
            <div className="site-delivery-zones-list" aria-label="Список зон">
              <span>
                <span className="site-delivery-zones-dot-group" aria-hidden="true">
                  {zoneLegendColors.map((color) => (
                    <i key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
                Зоны бесплатной доставки
              </span>
            </div>
          ) : null}
          {message && status !== "error" ? <p className="site-delivery-zones-message">{message}</p> : null}
        </aside>
      </section>

      <SiteFooter />
    </SitePublicShell>
  );
}
