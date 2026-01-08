import { defineComponent, h, ref, watch } from "vue";
import type { PropType } from "vue";
import { normalizeSvg, stripWidthHeight, toCurrentColor } from "./transform";
import {
  buildCacheKey,
  clearRemoteSvgCache,
  fetchRemoteSvg,
  getRemoteSvgSecurity,
  resolveSecurityOptions,
  sanitizeSvg,
  type RemoteSvgSecurityOptions,
  verifyRemoteSvg
} from "./remote-security";

const BASE_STYLE = { display: "inline-block", lineHeight: "0" };
const DEFAULT_SIZE = 24;

function sanitizeTitle(title?: string): string {
  if (!title) return "";
  return String(title).replace(/[<>]/g, "");
}

function injectTitle(svg: string, title: string): string {
  if (!title) return svg;
  return svg.replace(/<svg\b[^>]*>/i, (match) => `${match}<title>${title}</title>`);
}

function hasSizeClass(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") return /(^|\s)(w|h)-/.test(value);
  if (Array.isArray(value)) return value.some(hasSizeClass);
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>)
    .some((key) => (value as Record<string, boolean>)[key] && /(^|\s)(w|h)-/.test(key));
  return false;
}

function processSvg(raw: string, replaceColors: boolean, title: string): string {
  let svg = normalizeSvg(raw);
  svg = stripWidthHeight(svg);
  if (replaceColors) {
    svg = toCurrentColor(svg);
  }
  const safeTitle = sanitizeTitle(title);
  return injectTitle(svg, safeTitle);
}

function sanitizeOrThrow(svg: string, strict: boolean): string {
  const sanitized = sanitizeSvg(svg, strict);
  if (!sanitized && strict) {
    throw new Error("SVG failed sanitization");
  }
  return sanitized;
}

export default defineComponent({
  name: "RemoteSvg",
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    size: { type: [Number, String], default: undefined },
    title: { type: String, default: "" },
    decorative: { type: Boolean, default: true },
    replaceColors: { type: Boolean, default: true },
    security: { type: Object as PropType<RemoteSvgSecurityOptions | null>, default: undefined }
  },
  setup(props: any, { attrs }: any) {
    const rawSvg = ref("");
    const svgHtml = ref("");

    const renderSvg = (securityOverride?: ReturnType<typeof resolveSecurityOptions>) => {
      if (!rawSvg.value) {
        svgHtml.value = "";
        return;
      }
      const security = securityOverride ?? resolveSecurityOptions(props.security, getRemoteSvgSecurity());
      let output = processSvg(rawSvg.value, props.replaceColors !== false, props.title);
      if (security?.sanitize) {
        const sanitized = sanitizeSvg(output, true);
        if (!sanitized) {
          svgHtml.value = "";
          return;
        }
        output = sanitized;
      }
      svgHtml.value = output;
    };

    const loadSvg = async () => {
      const security = resolveSecurityOptions(props.security, getRemoteSvgSecurity());
      const cacheKey = buildCacheKey(props.src, security);

      if (!props.src) {
        rawSvg.value = "";
        svgHtml.value = "";
        return;
      }
      try {
        const result = await fetchRemoteSvg(props.src, cacheKey);
        if (security) {
          await verifyRemoteSvg(result, security, props.src);
          rawSvg.value = security.sanitize
            ? sanitizeOrThrow(result.text, true)
            : result.text;
        } else {
          rawSvg.value = result.text;
        }
        renderSvg(security);
      } catch (error) {
        clearRemoteSvgCache(cacheKey);
        console.error(`[vue-smart-svg] Failed to fetch SVG from "${props.src}"`, error);
        rawSvg.value = "";
        svgHtml.value = "";
      }
    };

    watch(() => props.src, () => loadSvg(), { immediate: true });
    watch(() => props.security, () => loadSvg(), { deep: true });
    watch(() => [props.title, props.replaceColors], () => renderSvg());

    return () => {
      const sizeProp = props.size;
      const sizeValue = sizeProp == null ? DEFAULT_SIZE : sizeProp;
      const sizeCss = typeof sizeValue === "number" ? `${sizeValue}px` : String(sizeValue);
      const attrsSafe = attrs || {};
      const shouldApplySize = !(sizeProp == null && hasSizeClass(attrsSafe.class));
      const sizeStyle = shouldApplySize ? { width: sizeCss, height: sizeCss } : {};
      const style = [BASE_STYLE, sizeStyle, attrsSafe.style];
      const hasTitle = Boolean(props.title);
      const ariaHidden = attrsSafe["aria-hidden"] ?? (props.decorative && !hasTitle ? "true" : undefined);
      const role = attrsSafe.role ?? (!props.decorative && hasTitle ? "img" : undefined);
      const ariaLabel = attrsSafe["aria-label"] ?? (!props.decorative && hasTitle ? props.title : undefined);

      return h("span", {
        ...attrsSafe,
        style,
        "aria-hidden": ariaHidden,
        role,
        "aria-label": ariaLabel,
        innerHTML: svgHtml.value || undefined
      });
    };
  }
});

export { setRemoteSvgSecurity, getRemoteSvgSecurity } from "./remote-security";
export type { RemoteSvgSecurityOptions } from "./remote-security";
