import sharp from 'sharp';

export type HSV = [number, number, number];

export async function computeDominantColor(buffer: Buffer): Promise<{ hex: string; hsv: HSV }> {
  const { data, info } = await sharp(buffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (let i = 0; i < data.length; i += 3) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  const r = Math.round(rSum / pixels);
  const g = Math.round(gSum / pixels);
  const b = Math.round(bSum / pixels);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const hsv = rgbToHsv(r, g, b);
  return { hex, hsv };
}

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return [h, s, v];
}

export function hsvDistance(a: HSV, b: HSV): number {
  const hueDiff = Math.min(Math.abs(a[0] - b[0]), 360 - Math.abs(a[0] - b[0])) / 180;
  const satDiff = Math.abs(a[1] - b[1]);
  const valDiff = Math.abs(a[2] - b[2]);
  return Math.sqrt(hueDiff ** 2 + satDiff ** 2 + valDiff ** 2);
}
