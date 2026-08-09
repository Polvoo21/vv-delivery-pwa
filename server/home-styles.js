import { readFile } from "node:fs/promises";
import path from "node:path";

const STYLESHEET_LINK = /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+\.css)["'])[^>]*>/i;
const styleCache = new Map();

export async function inlineHomeStyles(source, distDir) {
  const match = String(source || "").match(STYLESHEET_LINK);

  if (!match) return source;

  const stylesheetUrl = match[1];
  const stylesheetPath = path.resolve(distDir, `.${stylesheetUrl}`);
  const normalizedDistDir = `${path.resolve(distDir)}${path.sep}`;

  if (!stylesheetPath.startsWith(normalizedDistDir)) return source;

  try {
    let stylesPromise = styleCache.get(stylesheetPath);

    if (!stylesPromise) {
      stylesPromise = readFile(stylesheetPath, "utf8");
      styleCache.set(stylesheetPath, stylesPromise);
    }

    const styles = (await stylesPromise).replaceAll("</style", "<\\/style");
    return source.replace(match[0], `<style data-home-critical>${styles}</style>`);
  } catch {
    styleCache.delete(stylesheetPath);
    return source;
  }
}
