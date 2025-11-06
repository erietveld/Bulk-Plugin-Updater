import {
    createTheme,
    lighten,
    virtualColor,
  } from "@mantine/core";
  
     const theme = createTheme({
         defaultRadius: "0.5rem",
         white: "oklch(0.99 0 0)", 
         black: "oklch(0 0 0)", 
         primaryColor: "primary",
         primaryShade: 5,
         defaultGradient: {
           from: "oklch(0.94 0 0)",
           to: "oklch(0.32 0 0)",
           deg: 113,
         },
         colors: {
           primary: virtualColor({
             name: "primary",
             dark: "primarydark",
             light: "primarylight",
           }),
           //dark -mode
           dark: [
             "oklch(1.00 0 0)",
             "oklch(1.00 0 0)",
             "rgba(77, 77, 77, 1)",
             "oklch(0.72 0 0)",
             "oklch(0.26 0 0)",
             "oklch(0.25 0 0)",
             "oklch(0.23 0 0)",
             "oklch(0 0 0)",
             "rgba(0, 0, 0, 1)",
             "blue",
           ],
     
           //light -mode
           gray: [
             "oklch(0.94 0 0)",
             "rgba(77, 77, 77, 1)",
             "oklch(0.97 0 0)",
             "oklch(0.94 0 0)",
             "oklch(0.92 0 0)",
             "oklch(0.44 0 0)",
             "rgba(77, 77, 77, 1)",
             "oklch(0 0 0)",
             "red",
             "oklch(0 0 0)",
           ],
           primarylight: [
             "green",
             "green",
             "green",
             "green",
             "green",
             "oklch(0 0 0)",
             "rgba(38, 38, 38, 1)",
             "green",
             "green",
             "green",
           ],
           primarydark: [
             "oklch(1.00 0 0)",
             "oklch(1.00 0 0)",
             "yellow",
             "oklch(1.00 0 0)",
             "oklch(1.00 0 0)",
             "oklch(1.00 0 0)",
             "rgba(0, 0, 0, 1)",
             "yellow",
             "yellow",
             "yellow",
           ],
         },
         // Add enhanced metadata for theme system compatibility
         other: {
           performanceOptimized: true,
           backgroundGradient: 'linear-gradient(135deg, oklch(0.99 0 0) 0%, oklch(0.94 0 0) 25%, oklch(0.97 0 0) 50%, oklch(0.94 0 0) 75%, oklch(0.99 0 0) 100%)',
           cssVariables: {
             '--theme-primary': 'oklch(0 0 0)',
             '--theme-background': 'linear-gradient(135deg, oklch(0.99 0 0) 0%, oklch(0.94 0 0) 25%, oklch(0.97 0 0) 50%, oklch(0.94 0 0) 75%, oklch(0.99 0 0) 100%)',
             '--theme-surface': 'oklch(0.99 0 0)',
             '--theme-border': 'oklch(0.94 0 0)',
             '--theme-text': 'oklch(0 0 0)'
           }
         }
       });

export default theme;