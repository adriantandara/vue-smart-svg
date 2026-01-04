export type VueVersionOption = 2 | 3 | "auto";
export type RawMode = "query" | "suffix" | "both";

export interface LoaderOptions {
  svgo?: boolean;
  defaultSize?: number;
  replaceColors?: boolean;
  keepViewBox?: boolean;
  vueVersion?: VueVersionOption;
  rawMode?: RawMode;
}

export interface GenerateOptions {
  defaultSize: number;
  defaultReplaceColors: boolean;
}
