
export const hexToRgb = (hex) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(char => char + char).join('');
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};


export const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const adjustBrightness = (hex, percent) => {
  const [r, g, b] = hexToRgb(hex);
  
  const adjust = (val) => {
    return Math.max(0, Math.min(255, Math.round(val + (255 - val) * (percent / 100))));
  };
  
  const adjustDark = (val) => {
    return Math.max(0, Math.min(255, Math.round(val * (1 + (percent / 100)))));
  };

  if (percent > 0) {
    return rgbToHex(adjust(r), adjust(g), adjust(b));
  } else {
    return rgbToHex(adjustDark(r), adjustDark(g), adjustDark(b));
  }
};


export const generatePalette = (primaryHex) => {
  if (!primaryHex || !primaryHex.startsWith('#')) primaryHex = '#58341d'; 
  
  return {
    primary: primaryHex,
    primaryHover: adjustBrightness(primaryHex, -15), 
    primaryContainer: adjustBrightness(primaryHex, 70), 
    onPrimaryContainer: adjustBrightness(primaryHex, -40), 
    
    secondary: adjustBrightness(primaryHex, 15),
    secondaryContainer: adjustBrightness(primaryHex, 75),
    
    surface: adjustBrightness(primaryHex, 97),
    surfaceDim: adjustBrightness(primaryHex, 88), 
    surfaceContainer: adjustBrightness(primaryHex, 92),
    surfaceContainerHigh: adjustBrightness(primaryHex, 90),
    surfaceContainerHighest: adjustBrightness(primaryHex, 87),
    background: adjustBrightness(primaryHex, 97),
    
    onSurface: adjustBrightness(primaryHex, -70), 
    onSurfaceVariant: adjustBrightness(primaryHex, -30), 
    
    outline: adjustBrightness(primaryHex, 40), 
    outlineVariant: adjustBrightness(primaryHex, 85), 
  };
};
