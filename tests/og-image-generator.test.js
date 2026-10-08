import { describe, it, expect } from 'vitest';
import { Resvg } from '@resvg/resvg-js';

describe('Resvg Rasterization Core', () => {
  it('renders a simple SVG into a 1200x630 PNG buffer', () => {
    const svg = '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#070b16"/></svg>';
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    expect(pngBuffer).toBeInstanceOf(Buffer);
    expect(pngBuffer.length).toBeGreaterThan(100);
    // Check PNG signature: \x89PNG\r\n\x1a\n (hex: 89504e47)
    expect(pngBuffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    expect(pngData.width).toBe(1200);
    expect(pngData.height).toBe(630);
  });
});
