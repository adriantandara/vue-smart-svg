function replaceColorAttr(svg: string, attr: "fill" | "stroke"): string {
  const regex = new RegExp(`\\s${attr}=("|')?([^"'\\s>]+)\\1`, "gi");
  return svg.replace(regex, (match, quote, value) => {
    if (String(value).toLowerCase() === "none") {
      return match;
    }
    const q = quote || '"';
    return ` ${attr}=${q}currentColor${q}`;
  });
}

export function stripWidthHeight(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    const cleaned = String(attrs)
      .replace(/\s(width|height)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s{2,}/g, " ");
    const normalized = cleaned.trim();
    return normalized ? `<svg ${normalized}>` : "<svg>";
  });
}

export function toCurrentColor(svg: string): string {
  return replaceColorAttr(replaceColorAttr(svg, "fill"), "stroke");
}

export function normalizeSvg(svg: string): string {
  return svg.replace(/\r?\n/g, "").trim();
}
