let rendererPromise;

export async function renderHomeApp() {
  try {
    rendererPromise ||= import("../dist-ssr/home-ssr.js");
    const renderer = await rendererPromise;
    return renderer.renderHome();
  } catch {
    return "";
  }
}
