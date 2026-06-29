/**
 * Converts a hex color string to an RGB array.
 */
export const hexToRgb = (hex) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(char => char + char).join('');
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

/**
 * Converts an RGB array back to a hex string.
 */
export const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Adjusts the brightness of a hex color.
 * Positive amount = lighter, Negative amount = darker.
 */
export const adjustBrightness = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  
  const adjust = (val) => {
    return Math.max(0, Math.min(255, Math.round(val + (255 - val) * (percent / 100))));
  };
  
  // If we want darker, we go towards 0 instead of 255
  const adjustDark = (val) => {
    return Math.max(0, Math.min(255, Math.round(val * (1 + (percent / 100)))));
  };

  if (percent > 0) {
    return rgbToHex(adjust(r), adjust(g), adjust(b));
  } else {
    return rgbToHex(adjustDark(r), adjustDark(g), adjustDark(b));
  }
};

/**
 * Generates a full color palette from a single primary hex color.
 */
export const generatePalette = (primaryHex) => {
  if (!primaryHex || !primaryHex.startsWith('#')) primaryHex = '#58341d'; // default brown
  
  return {
    primary: primaryHex,
    primaryHover: adjustBrightness(primaryHex, -15), // darker for hover
    primaryContainer: adjustBrightness(primaryHex, 70), // much lighter for badges
    onPrimaryContainer: adjustBrightness(primaryHex, -40), // very dark for text on badges
    
    // Secondary (slightly lighter/muted version of primary)
    secondary: adjustBrightness(primaryHex, 15),
    secondaryContainer: adjustBrightness(primaryHex, 75),
    
    // Backgrounds and surfaces
    surface: adjustBrightness(primaryHex, 97), // almost white with a tint
    surfaceDim: adjustBrightness(primaryHex, 88), // slightly tinted
    surfaceContainer: adjustBrightness(primaryHex, 92), // very light tint for cards/tables
    surfaceContainerHigh: adjustBrightness(primaryHex, 90),
    surfaceContainerHighest: adjustBrightness(primaryHex, 87),
    background: adjustBrightness(primaryHex, 97),
    
    // Text colors
    onSurface: adjustBrightness(primaryHex, -70), // very dark for main text
    onSurfaceVariant: adjustBrightness(primaryHex, -30), // dark for secondary text
    
    // Borders
    outline: adjustBrightness(primaryHex, 40), // mid-tone for borders
    outlineVariant: adjustBrightness(primaryHex, 85), // light border
  };
};
