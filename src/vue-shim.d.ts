declare module "vue" {
  export type PropType<T> = any;
  export function defineComponent(options: any): any;
  export function h(...args: any[]): any;
  export function ref<T = any>(value?: T): any;
  export function watch(source: any, cb: any, options?: any): any;
}
