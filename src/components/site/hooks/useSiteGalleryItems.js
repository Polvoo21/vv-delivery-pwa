import { useEffect, useMemo, useState } from "react";
import { apiPath } from "../../../utils/api";
import { siteGalleryPhotos, siteGalleryVideos } from "../siteGalleryData";

export function getFallbackGalleryItems() {
  return [
    ...siteGalleryPhotos.slice(0, 5).map((item) => ({ ...item, type: "photo" })),
    ...siteGalleryVideos.map((item) => ({ ...item, type: "video" })),
    ...siteGalleryPhotos.slice(5).map((item) => ({ ...item, type: "photo" }))
  ];
}

export function useSiteGalleryItems() {
  const fallbackItems = useMemo(getFallbackGalleryItems, []);
  const [items, setItems] = useState(fallbackItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const response = await fetch(apiPath("siteGallery"));
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && data.ok === true && Array.isArray(data.items)) {
          setItems(data.items);
        }
      } catch {
        // Static gallery is the fallback while the managed gallery is empty or unavailable.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, []);

  const photos = useMemo(() => items.filter((item) => item.type !== "video"), [items]);
  const videos = useMemo(() => items.filter((item) => item.type === "video"), [items]);

  return {
    items,
    photos,
    videos,
    loading
  };
}
