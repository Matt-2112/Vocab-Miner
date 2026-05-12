declare module "stopword" {
  export const eng: string[];
  export const deu: string[];
  export const fra: string[];
  export const spa: string[];
  export const ita: string[];
  export const por: string[];
  export const nld: string[];
  export const pol: string[];
  export const rus: string[];
  export const jpn: string[];
  export const zho: string[];
  export const kor: string[];
  export function removeStopwords(tokens: string[], stopwords?: string[]): string[];
}
