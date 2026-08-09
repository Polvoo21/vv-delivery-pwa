import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageSets = [
  {
    source: "public/assets/site/interior-window-real.webp",
    outputPrefix: "public/assets/site/interior-window-hero",
    widths: [480, 720],
    aspectRatio: 720 / 636
  },
  {
    source: "public/assets/site/masterclass-real/masterclass-real-06.webp",
    outputPrefix: "public/assets/site/masterclass-promo-hero",
    widths: [480, 800],
    aspectRatio: 800 / 383,
    avifQualityByWidth: { 480: 30 }
  },
  {
    source: "public/assets/site/concept-pizza-oven.jpg",
    outputPrefix: "public/assets/site/no-gloves-hero",
    widths: [640, 1280],
    aspectRatio: 1680 / 1121
  }
];

await Promise.all(
  imageSets.flatMap((imageSet) =>
    imageSet.widths.flatMap((width) => {
      const source = path.join(rootDir, imageSet.source);
      const outputPrefix = path.join(rootDir, imageSet.outputPrefix);
      const height = Math.round(width / imageSet.aspectRatio);
      const pipeline = () =>
        sharp(source).resize(width, height, {
          fit: "cover",
          position: "centre"
        });

      return [
        pipeline()
          .avif({ quality: imageSet.avifQualityByWidth?.[width] ?? 58, effort: 6 })
          .toFile(`${outputPrefix}-${width}.avif`),
        pipeline()
          .webp({ quality: 78, effort: 5 })
          .toFile(`${outputPrefix}-${width}.webp`)
      ];
    })
  )
);

console.log("Generated responsive AVIF/WebP variants for priority landing-page images.");
