export interface OcrResult { text: string }
export interface OcrAdapter {
  /** 画像（dataURL/Blob等の抽象）からテキストを認識。引数なしならカメラ起動を想定。 */
  recognize(image?: unknown): Promise<OcrResult>
  isAvailable(): Promise<boolean>
}
