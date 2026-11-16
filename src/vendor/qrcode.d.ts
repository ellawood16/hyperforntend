/** QRCode for JavaScript, Kazuhiko Arase; see qrcode.LICENSE. */
export default class QRCode {
  constructor(version: number, correctionLevel: number);
  addData(value: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, column: number): boolean;
}
