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
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .some((key) => (value as Record<string, boolean>)[key] && /(^|\s)(w|h)-/.test(key));
  }
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

const RemoteSvg: any = {
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
  data() {
    return { rawSvg: "", svgHtml: "" };
  },
  watch: {
    src: {
      immediate: true,
      handler(this: any) {
        this.loadSvg();
      }
    },
    security: {
      deep: true,
      handler(this: any) {
        this.loadSvg();
      }
    },
    title(this: any) {
      this.renderSvg();
    },
    replaceColors(this: any) {
      this.renderSvg();
    }
  },
  methods: {
    async loadSvg(this: any) {
      const security = resolveSecurityOptions(this.security, getRemoteSvgSecurity());
      const cacheKey = buildCacheKey(this.src, security);

      if (!this.src) {
        this.rawSvg = "";
        this.svgHtml = "";
        return;
      }
      try {
        const result = await fetchRemoteSvg(this.src, cacheKey);
        if (security) {
          await verifyRemoteSvg(result, security, this.src);
          this.rawSvg = security.sanitize
            ? sanitizeOrThrow(result.text, true)
            : result.text;
        } else {
          this.rawSvg = result.text;
        }
        this.renderSvg();
      } catch (error) {
        clearRemoteSvgCache(cacheKey);
        console.error(`[vue-smart-svg] Failed to fetch SVG from "${this.src}"`, error);
        this.rawSvg = "";
        this.svgHtml = "";
      }
    },
    renderSvg(this: any) {
      if (!this.rawSvg) {
        this.svgHtml = "";
        return;
      }
      const security = resolveSecurityOptions(this.security, getRemoteSvgSecurity());
      let output = processSvg(this.rawSvg, this.replaceColors !== false, this.title);
      if (security?.sanitize) {
        const sanitized = sanitizeSvg(output, true);
        if (!sanitized) {
          this.svgHtml = "";
          return;
        }
        output = sanitized;
      }
      this.svgHtml = output;
    }
  },
  render(this: any, h: (tag: any, data?: any, children?: any) => any) {
    const sizeProp = this.size;
    const sizeValue = sizeProp == null ? DEFAULT_SIZE : sizeProp;
    const sizeCss = typeof sizeValue === "number" ? `${sizeValue}px` : String(sizeValue);
    const vnodeData = (this as any).$vnode?.data || {};
    const attrs = this.$attrs || {};
    const classData = vnodeData.class || vnodeData.staticClass;
    const shouldApplySize = !(sizeProp == null && (hasSizeClass(vnodeData.class) || hasSizeClass(vnodeData.staticClass)));
    const sizeStyle = shouldApplySize ? { width: sizeCss, height: sizeCss } : {};
    const style = [BASE_STYLE, sizeStyle, vnodeData.style, attrs.style];
    const hasTitle = Boolean(this.title);
    const ariaHidden = attrs["aria-hidden"] != null ? attrs["aria-hidden"] : (this.decorative && !hasTitle ? "true" : undefined);
    const role = attrs.role != null ? attrs.role : (!this.decorative && hasTitle ? "img" : undefined);
    const ariaLabel = attrs["aria-label"] != null ? attrs["aria-label"] : (!this.decorative && hasTitle ? this.title : undefined);
    const mergedAttrs = { ...attrs };
    if (ariaHidden !== undefined) mergedAttrs["aria-hidden"] = ariaHidden;
    if (role !== undefined) mergedAttrs.role = role;
    if (ariaLabel !== undefined) mergedAttrs["aria-label"] = ariaLabel;

    return h("span", {
      attrs: mergedAttrs,
      class: [vnodeData.staticClass, vnodeData.class],
      style,
      on: (this as any).$listeners,
      domProps: { innerHTML: this.svgHtml || undefined }
    });
  }
};

export default RemoteSvg;

export { setRemoteSvgSecurity, getRemoteSvgSecurity } from "./remote-security";
export type { RemoteSvgSecurityOptions } from "./remote-security";
