/**
 * Theme configuration for IDSS Web
 * Stores color schemes for light and dark modes
 */

export interface ThemeColors {
  // Backgrounds
  mainBackground: string;
  cardBackground: string;
  sidebarBackground: string;
  inputBackground: string;
  
  // Text
  primaryText: string;
  secondaryText: string;
  labelText: string;
  priceText: string;
  
  // Borders
  primaryBorder: string;
  secondaryBorder: string;
  hoverBorder: string;
  
  // Buttons & Interactive
  buttonBackground: string;
  buttonHover: string;
  heartActive: string;
  heartInactive: string;
}

// Dark Mode Theme (current maroon theme)
export const darkModeTheme: ThemeColors = {
  mainBackground: 'bg-[#5a0a0f]/75',
  cardBackground: 'bg-[#5a0a0f]/60',
  sidebarBackground: 'bg-[#5a0a0f]/75',
  inputBackground: 'bg-[#5a0a0f]/40',
  
  primaryText: 'text-white',
  secondaryText: 'text-white/60',
  labelText: 'text-white/60',
  priceText: 'text-white',
  
  primaryBorder: 'border-[#6d0f14]/60',
  secondaryBorder: 'border-[#6d0f14]/50',
  hoverBorder: 'border-[#6d0f14]/80',
  
  buttonBackground: 'bg-[#8C1515]',
  buttonHover: 'bg-[#750013]',
  heartActive: 'text-[#ff1323] fill-[#ff1323]',
  heartInactive: 'text-white/60',
};

// Light Mode Theme (original Stanford theme)
export const lightModeTheme: ThemeColors = {
  mainBackground: 'bg-white',
  cardBackground: 'bg-white',
  sidebarBackground: 'bg-white',
  inputBackground: 'bg-white',
  
  primaryText: 'text-black',
  secondaryText: 'text-black/60',
  labelText: 'text-[#8b959e]',
  priceText: 'text-[#8C1515]',
  
  primaryBorder: 'border-[#8b959e]/30',
  secondaryBorder: 'border-[#8b959e]/40',
  hoverBorder: 'border-[#8C1515]',
  
  buttonBackground: 'bg-gradient-to-r from-[#8C1515] to-[#750013]',
  buttonHover: 'from-[#750013] to-[#8C1515]',
  heartActive: 'text-[#ff1323] fill-[#ff1323]',
  heartInactive: 'text-[#8b959e]',
};

// Current theme - can be switched between lightModeTheme and darkModeTheme
export const currentTheme = lightModeTheme;
