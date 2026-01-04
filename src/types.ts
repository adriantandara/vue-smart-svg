export type VueVersionOption = 2 | 3 | "auto";

export interface LoaderOptions {
  svgo?: boolean;
  defaultSize?: number;
  replaceColors?: boolean;
  keepViewBox?: boolean;
  vueVersion?: VueVersionOption;
}

export interface GenerateOptions {
  defaultSize: number;
}