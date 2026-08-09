import { SiteFaqSection } from "./SiteFaqSection";
import { SiteFooter } from "./SiteFooter";
import { SiteGallerySection } from "./SiteGallerySection";
import { SiteMapSection } from "./SiteMapSection";
import { SiteSeoSection } from "./SiteSeoSection";

export function HomepageBelowFold() {
  return (
    <>
      <SiteGallerySection />
      <SiteFaqSection />
      <SiteMapSection />
      <SiteSeoSection />
      <SiteFooter />
    </>
  );
}
