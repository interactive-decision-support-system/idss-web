/**
 * Theme configuration for the recommendation system.
 * Supports light and dark mode color schemes.
 */

export interface ThemeColors {
  // Main backgrounds
  pageBg: string;
  sidebarBg: string;
  cardBg: string;
  inputBg: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  
  // Button colors
  buttonBg: string;
  buttonHoverBg: string;
  buttonText: string;
  
  // Quick reply buttons
  quickReplyBg: string;
  quickReplyHoverBg: string;
  quickReplyBorder: string;
  quickReplyHoverBorder: string;
  quickReplyText: string;
  
  // User message bubble
  userBubbleBg: string;
  userBubbleText: string;
  
  // Hover states
  hoverBg: string;
  
  // Loading indicator
  loadingDot: string;
  loadingDotAccent: string;
  loadingText: string;
}

export const lightTheme: ThemeColors = {
  // Main backgrounds
  pageBg: 'bg-white',
  sidebarBg: 'bg-white',
  cardBg: 'bg-white',
  inputBg: 'bg-white',
  
  // Text colors
  textPrimary: 'text-black',
  textSecondary: 'text-black/60',
  textMuted: 'text-black/40',
  
  // Border colors
  borderPrimary: 'border-black/20',
  borderSecondary: 'border-black/10',
  
  // Button colors
  buttonBg: 'bg-[#8C1515]',
  buttonHoverBg: 'hover:bg-[#750013]',
  buttonText: 'text-white',
  
  // Quick reply buttons
  quickReplyBg: 'bg-white',
  quickReplyHoverBg: 'hover:bg-black/5',
  quickReplyBorder: 'border-black/20',
  quickReplyHoverBorder: 'hover:border-black/40',
  quickReplyText: 'text-black',
  
  // User message bubble
  userBubbleBg: 'bg-gradient-to-r from-[#8C1515] to-[#750013]',
  userBubbleText: 'text-white',
  
  // Hover states
  hoverBg: 'hover:bg-black/5',
  
  // Loading indicator
  loadingDot: 'bg-[#8b959e]',
  loadingDotAccent: 'bg-[#8C1515]',
  loadingText: 'text-[#8b959e]',
};

export const darkTheme: ThemeColors = {
  // Main backgrounds
  pageBg: 'bg-[#5a0a0f]/75',
  sidebarBg: 'bg-[#5a0a0f]/75',
  cardBg: 'bg-[#5a0a0f]/60',
  inputBg: 'bg-[#5a0a0f]/40',
  
  // Text colors
  textPrimary: 'text-white',
  textSecondary: 'text-white/60',
  textMuted: 'text-white/40',
  
  // Border colors
  borderPrimary: 'border-[#6d0f14]/60',
  borderSecondary: 'border-[#6d0f14]/40',
  
  // Button colors
  buttonBg: 'bg-[#8C1515]',
  buttonHoverBg: 'hover:bg-[#750013]',
  buttonText: 'text-white',
  
  // Quick reply buttons
  quickReplyBg: 'bg-[#5a0a0f]/50',
  quickReplyHoverBg: 'hover:bg-[#5a0a0f]/60',
  quickReplyBorder: 'border-[#6d0f14]/50',
  quickReplyHoverBorder: 'hover:border-[#6d0f14]/70',
  quickReplyText: 'text-white',
  
  // User message bubble
  userBubbleBg: 'bg-gradient-to-r from-[#8C1515] to-[#750013]',
  userBubbleText: 'text-white',
  
  // Hover states
  hoverBg: 'hover:bg-white/10',
  
  // Loading indicator
  loadingDot: 'bg-white/60',
  loadingDotAccent: 'bg-white',
  loadingText: 'text-white/70',
};

// Current active theme - change this to switch between light and dark mode
export const currentTheme = lightTheme;
