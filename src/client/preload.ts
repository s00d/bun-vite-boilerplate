export function renderPreloadLinks(modules: Set<string>, manifest: Record<string, string[]>) {
  const seen = new Set();
  let links = "";
  for (const id of modules) {
    const files = manifest[id];
    if (files) {
      for (const file of files) {
        if (!seen.has(file)) {
          seen.add(file);
          if (file.endsWith(".js")) {
            links += `<link rel="modulepreload" crossorigin href="/${file}">`;
          } else if (file.endsWith(".css")) {
            links += `<link rel="stylesheet" href="/${file}">`;
          }
        }
      }
    }
  }
  return links;
}
