/**
 * Generates a base nickname from name + lastName.
 * Rules:
 *  - Lowercase
 *  - Remove accents/diacritics
 *  - Keep only alphanumeric characters
 *  - Format: firstWord + first word of lastName  (e.g. "Juan García" → "juangarcia")
 *  - Max 20 chars before the suffix
 */
export function generateBaseNickname(name: string, lastName?: string): string {
  const normalize = (str: string) =>
    str
      .normalize('NFD')                    // decompose accented chars
      .replace(/[\u0300-\u036f]/g, '')     // strip diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');          // keep only alphanumeric

  const firstName  = normalize(name.split(' ')[0]);
  const firstLast  = lastName ? normalize(lastName.split(' ')[0]) : '';
  const base       = `${firstName}${firstLast}`.slice(0, 20);

  return base || 'user';
}

/**
 * Appends a random numeric suffix to make a nickname unique.
 * e.g. "juangarcia" → "juangarcia4821"
 */
export function generateNicknameSuffix(base: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `${base}${suffix}`;
}
