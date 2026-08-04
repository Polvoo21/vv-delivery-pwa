import { ASSET, SOCIAL_LINKS } from "./siteData";

export const LOST_ITEMS_STORAGE_MONTHS = 3;

export const lostItemContactLinks = {
  vk: SOCIAL_LINKS.vk,
  telegram: SOCIAL_LINKS.telegram
};

const LOST_ITEM_IMPORT_DATE = "2026-07-07";
export const LOST_ITEM_IMAGE_COUNT = 70;

export const siteLostItems = Array.from({ length: LOST_ITEM_IMAGE_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");

  return {
    id: `lost-${number}`,
    itemNumber: index + 1,
    addedAt: LOST_ITEM_IMPORT_DATE,
    image: `${ASSET}lost-items/lost-${number}.webp`
  };
});

export function getLostItemDeadline(addedAt) {
  const deadline = new Date(`${addedAt}T12:00:00`);
  deadline.setMonth(deadline.getMonth() + LOST_ITEMS_STORAGE_MONTHS);
  return deadline;
}
