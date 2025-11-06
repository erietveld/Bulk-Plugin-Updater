import {
    createTheme,
    lighten,
    virtualColor,
  } from "@mantine/core";
  
     const theme = createTheme({
         defaultRadius: "0.5rem",
         white: "#f5f5ff", 
         black: "#2a2a4a", 
         primaryColor: "primary",
         primaryShade: 5,
         defaultGradient: {
           from: "#d8e6ff",
           to: "#303060",
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
             "#e2e2f5",
             "#e2e2f5",
             "rgba(189, 189, 211, 1)",
             "#a0a0c0",
             "#303052",
             "#2d2b55",
             "#222244",
             "#0f0f1a",
             "rgba(12, 12, 21, 1)",
             "blue",
           ],
     
           //light -mode
           gray: [
             "#e4dfff",
             "rgba(236, 233, 255, 1)",
             "#f0f0fa",
             "#e0e0f0",
             "#e0e0f0",
             "#6c6c8a",
             "rgba(152, 152, 173, 1)",
             "#2a2a4a",
             "red",
             "#2a2a4a",
           ],
           primarylight: [
             "green",
             "green",
             "green",
             "green",
             "green",
             "#6e56cf",
             "rgba(132, 111, 214, 1)",
             "green",
             "green",
             "green",
           ],
           primarydark: [
             "#e2e2f5",
             "#a48fff",
             "yellow",
             "#a48fff",
             "#a48fff",
             "#a48fff",
             "rgba(139, 122, 217, 1)",
             "yellow",
             "yellow",
             "yellow",
           ],
         },
         // Add enhanced metadata for theme system compatibility
         other: {
           performanceOptimized: true,
           backgroundGradient: 'linear-gradient(135deg, #f5f5ff 0%, #e4dfff 25%, #f0f0fa 50%, #e0e0f0 75%, #f5f5ff 100%)',
           cssVariables: {
             '--theme-primary': '#6e56cf',
             '--theme-background': 'linear-gradient(135deg, #f5f5ff 0%, #e4dfff 25%, #f0f0fa 50%, #e0e0f0 75%, #f5f5ff 100%)',
             '--theme-surface': '#f5f5ff',
             '--theme-border': '#e4dfff',
             '--theme-text': '#2a2a4a'
           }
         }
       });

export default theme;