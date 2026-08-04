import { useCallback, useEffect, useState } from "react";
import { apiPath } from "../../../utils/api";
import {
  DEFAULT_DELIVERY_SETTINGS,
  normalizeDeliverySettings,
  readStoredDeliverySettings,
  saveStoredDeliverySettings
} from "../../../utils/deliveryTiming";

export function useDeliverySettings() {
  const [deliverySettings, setDeliverySettings] = useState(() => readStoredDeliverySettings());

  const syncDeliverySettings = useCallback(() => {
    let cancelled = false;

    fetch(apiPath("siteDeliverySettings"))
      .then((response) => response.json().then((data) => ({ response, data })).catch(() => ({ response, data: {} })))
      .then(({ response, data }) => {
        if (cancelled || !response.ok || data.ok === false) {
          return;
        }

        const normalized = saveStoredDeliverySettings(data.settings || DEFAULT_DELIVERY_SETTINGS);
        setDeliverySettings(normalized);
      })
      .catch(() => {
        if (!cancelled) {
          setDeliverySettings(normalizeDeliverySettings(readStoredDeliverySettings()));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => syncDeliverySettings(), [syncDeliverySettings]);

  return {
    deliverySettings,
    syncDeliverySettings
  };
}
