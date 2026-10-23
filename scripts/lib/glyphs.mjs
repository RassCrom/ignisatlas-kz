import { open } from 'fontkit';

// The nine letters of the Kazakh alphabet that the Russian one lacks: ә ғ қ ң ө ұ ү һ і.
export const KAZAKH_CODEPOINTS = [0x04d9, 0x0493, 0x049b, 0x04a3, 0x04e9, 0x04b1, 0x04af, 0x04bb, 0x0456];

// Returns the code points that none of the font files has a glyph for, in input order.
// Fontsource splits a family into unicode-range subsets, so a letter counts as present
// when any of the given files covers it.
export async function missingCodePoints(fontFiles, codePoints) {
  const fonts = await Promise.all(fontFiles.map((file) => open(file)));
  // A collection (.ttc) opens as an object that wraps several fonts.
  const faces = fonts.flatMap((font) => font.fonts ?? [font]);
  return codePoints.filter((cp) => !faces.some((face) => face.hasGlyphForCodePoint(cp)));
}
