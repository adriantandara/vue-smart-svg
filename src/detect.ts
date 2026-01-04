export function detectVueMajor(version: string): 2 | 3 | null {
  const match = version.match(/^(\d+)\./);
  if (!match) {
    return null;
  }
  const major = Number(match[1]);
  if (major === 2 || major === 3) {
    return major;
  }
  return null;
}