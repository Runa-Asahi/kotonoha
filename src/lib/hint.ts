/** level 0: first letter + blanks; 1: every other letter revealed */
export function hint(word: string, level: number) {
  return word
    .split("")
    .map((c, i) => (c === " " || c === "-" || i === 0 || (level > 0 && i % 2 === 0) ? c : "_"))
    .join(" ");
}
