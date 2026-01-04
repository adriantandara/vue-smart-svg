import path from "path";
import { createRequire } from "module";
import { optimize } from "svgo";
import type { LoaderDefinitionFunction } from "webpack";
import { detectVueMajor } from "./detect";
import { generateVue2ComponentCode, generateVue3ComponentCode } from "./generate";
import { normalizeSvg, stripWidthHeight } from "./transform";
import type { LoaderOptions, VueVersionOption } from "./types";

const defaultOptions: Required<LoaderOptions> = {
  svgo: true,
  defaultSize: 24,
  replaceColors: true,
  keepViewBox: true,
  vueVersion: "auto",
  rawMode: "query"
};

function resolveVueVersion(option: VueVersionOption, context: string): 2 | 3 {
  if (option === 2 || option === 3) {
    return option;
  }

  try {
    const req = createRequire(path.join(context, "package.json"));
    const vuePkg = req("vue/package.json") as { version?: string };
    const major = detectVueMajor(String(vuePkg.version || ""));
    if (major) {
      return major;
    }
  } catch {
    return 3;
  }

  return 3;
}

const loader: LoaderDefinitionFunction<LoaderOptions> = function loader(source) {
  this.cacheable?.();

  const options: Required<LoaderOptions> = {
    ...defaultOptions,
    ...(this.getOptions() || {})
  };

  const query = this.resourceQuery || "";
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const resourcePath = this.resourcePath || "";

  const allowQueryRaw = options.rawMode === "query" || options.rawMode === "both";
  const allowSuffixRaw = options.rawMode === "suffix" || options.rawMode === "both";
  const isQueryRaw = allowQueryRaw && params.has("raw");
  const isSuffixRaw = allowSuffixRaw && resourcePath.toLowerCase().endsWith(".raw.svg");

  if (isQueryRaw || isSuffixRaw) {
    const raw = normalizeSvg(String(source));
    return `export default ${JSON.stringify(raw)};`;
  }

  let svg = String(source);

  if (options.svgo) {
    const result = optimize(svg, {
      multipass: true,
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: options.keepViewBox ? { removeViewBox: false } : {}
          }
        }
      ]
    });
    svg = result.data;
  }

  svg = stripWidthHeight(svg);
  svg = normalizeSvg(svg);

  const context = this.rootContext || this.context || process.cwd();
  const vueMajor = resolveVueVersion(options.vueVersion, context);
  const code = vueMajor === 2
    ? generateVue2ComponentCode(svg, { defaultSize: options.defaultSize, defaultReplaceColors: options.replaceColors })
    : generateVue3ComponentCode(svg, { defaultSize: options.defaultSize, defaultReplaceColors: options.replaceColors });

  return code;
};

export default loader;
