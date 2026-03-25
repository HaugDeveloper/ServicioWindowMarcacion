// === Time Logger ===
export const timeLog = (type, label) => {
  if (type === "start") {
    console.time(label);
  } else if (type === "end") {
    console.timeEnd(label);
  } else {
    console.warn(`timeLog: tipo desconocido "${type}"`);
  }
};
// ===================================

// === Delay Helper ===
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// =================================


export function renderTemplate(html: string, params: Record<string, any>) {
  return html.replace(/\$\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : "";
  });
}