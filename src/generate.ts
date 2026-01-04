import type { GenerateOptions } from "./types";

function sharedHelpers(svg: string, defaultSize: number): string {
  const svgLiteral = JSON.stringify(svg);
  return [
    `const __svg = ${svgLiteral};`,
    "const __defaultSize = " + defaultSize + ";",
    "const __baseStyle = { display: \"inline-block\", lineHeight: \"0\" };",
    "const __sanitizeTitle = (title) => (title ? String(title).replace(/[<>]/g, \"\") : \"\");",
    "const __injectTitle = (svg, title) => svg.replace(/<svg\\b[^>]*>/i, (m) => m + \"<title>\" + title + \"</title>\");",
    "const __resolveSvg = (title) => {",
    "  const safe = __sanitizeTitle(title);",
    "  return safe ? __injectTitle(__svg, safe) : __svg;",
    "};",
    "const __hasSizeClass = (klass) => {",
    "  if (!klass) return false;",
    "  if (typeof klass === \"string\") return /(^|\\s)(w|h)-/.test(klass);",
    "  if (Array.isArray(klass)) return klass.some(__hasSizeClass);",
    "  if (typeof klass === \"object\") return Object.keys(klass).some((key) => klass[key] && /(^|\\s)(w|h)-/.test(key));",
    "  return false;",
    "};"
  ].join("\n");
}

export function generateVue3ComponentCode(svg: string, options: GenerateOptions): string {
  const helpers = sharedHelpers(svg, options.defaultSize);
  return [
    "import { defineComponent, h } from \"vue\";",
    "",
    helpers,
    "",
    "export default defineComponent({",
    "  name: \"SmartSvgIcon\",",
    "  inheritAttrs: false,",
    "  props: {",
    "    size: { type: [Number, String], default: undefined },",
    "    title: { type: String, default: \"\" },",
    "    decorative: { type: Boolean, default: true }",
    "  },",
    "  setup(props, { attrs }) {",
    "    return () => {",
    "      const sizeProp = props.size;",
    "      const sizeValue = sizeProp == null ? __defaultSize : sizeProp;",
    "      const sizeCss = typeof sizeValue === \"number\" ? sizeValue + \"px\" : sizeValue;",
    "      const hasTitle = Boolean(props.title);",
    "      const attrsSafe = attrs || {};",
    "      const shouldApplySize = !(sizeProp == null && __hasSizeClass(attrsSafe.class));",
    "      const sizeStyle = shouldApplySize ? { width: sizeCss, height: sizeCss } : {};",
    "      const style = [__baseStyle, sizeStyle, attrsSafe.style];",
    "      const ariaHidden = attrsSafe[\"aria-hidden\"] ?? (props.decorative && !hasTitle ? \"true\" : undefined);",
    "      const role = attrsSafe.role ?? (!props.decorative && hasTitle ? \"img\" : undefined);",
    "      const ariaLabel = attrsSafe[\"aria-label\"] ?? (!props.decorative && hasTitle ? props.title : undefined);",
    "",
    "      return h(\"span\", {",
    "        ...attrsSafe,",
    "        style,",
    "        \"aria-hidden\": ariaHidden,",
    "        role,",
    "        \"aria-label\": ariaLabel,",
    "        innerHTML: __resolveSvg(props.title)",
    "      });",
    "    };",
    "  }",
    "});"
  ].join("\n");
}

export function generateVue2ComponentCode(svg: string, options: GenerateOptions): string {
  const helpers = sharedHelpers(svg, options.defaultSize);
  return [
    helpers,
    "",
    "export default {",
    "  name: \"SmartSvgIcon\",",
    "  functional: true,",
    "  props: {",
    "    size: { type: [Number, String] },",
    "    title: { type: String, default: \"\" },",
    "    decorative: { type: Boolean, default: true }",
    "  },",
    "  render(h, ctx) {",
    "    const props = ctx.props || {};",
    "    const data = ctx.data || {};",
    "    const attrs = data.attrs || {};",
    "    const sizeProp = props.size;",
    "    const sizeValue = sizeProp == null ? __defaultSize : sizeProp;",
    "    const sizeCss = typeof sizeValue === \"number\" ? sizeValue + \"px\" : sizeValue;",
    "    const hasTitle = Boolean(props.title);",
    "    const hasSizeClass = __hasSizeClass(data.class) || __hasSizeClass(data.staticClass);",
    "    const shouldApplySize = !(sizeProp == null && hasSizeClass);",
    "    const sizeStyle = shouldApplySize ? { width: sizeCss, height: sizeCss } : {};",
    "    const style = [__baseStyle, sizeStyle, data.style, attrs.style];",
    "    const ariaHidden = attrs[\"aria-hidden\"] != null ? attrs[\"aria-hidden\"] : (props.decorative && !hasTitle ? \"true\" : undefined);",
    "    const role = attrs.role != null ? attrs.role : (!props.decorative && hasTitle ? \"img\" : undefined);",
    "    const ariaLabel = attrs[\"aria-label\"] != null ? attrs[\"aria-label\"] : (!props.decorative && hasTitle ? props.title : undefined);",
    "    const mergedAttrs = { ...attrs };",
    "    if (ariaHidden !== undefined) mergedAttrs[\"aria-hidden\"] = ariaHidden;",
    "    if (role !== undefined) mergedAttrs.role = role;",
    "    if (ariaLabel !== undefined) mergedAttrs[\"aria-label\"] = ariaLabel;",
    "",
    "    return h(\"span\", {",
    "      ...data,",
    "      attrs: mergedAttrs,",
    "      style,",
    "      domProps: { ...(data.domProps || {}), innerHTML: __resolveSvg(props.title) }",
    "    });",
    "  }",
    "};"
  ].join("\n");
}
