import { rgbToHsv, hsvDistance } from '../../lib/colors';

test('rgbToHsv converts primary colors', () => {
  expect(rgbToHsv(255, 0, 0)[0]).toBeCloseTo(0);
  expect(rgbToHsv(0, 255, 0)[0]).toBeCloseTo(120);
  expect(rgbToHsv(0, 0, 255)[0]).toBeCloseTo(240);
});

test('hsvDistance is symmetrical', () => {
  const a: [number, number, number] = [10, 0.5, 0.5];
  const b: [number, number, number] = [20, 0.4, 0.4];
  expect(hsvDistance(a, b)).toBeCloseTo(hsvDistance(b, a));
});
