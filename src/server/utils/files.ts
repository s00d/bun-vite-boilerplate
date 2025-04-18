export async function readText(path: string): Promise<string> {
  return Bun.file(path).text(); // чтение файла в строку
}
export async function writeText(path: string, data: string): Promise<void> {
  await Bun.write(path, data); // запись файла
}
export async function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists(); // bool‑проверка
}
