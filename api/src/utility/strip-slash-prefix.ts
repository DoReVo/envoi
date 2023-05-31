export function stripSlashPrefix(path: string): string {
  return path.replace(/^\/*/gm, "");
}
