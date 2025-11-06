# 🚨 Web Awesome developer guide

## **Web Awesome developer reference**

Here's a **React 19 / TypeScript-first developer guide for integrating Web Awesome**—covering installation, usage, customizing, form controls, and localization. This guide is optimized for LLM or developer AI agents and assumes development only through a Web IDE, using NPM and `npm build` (no dev server, no local storage).[1]

***

## 1. Installation (React 19 + TypeScript)

- Run in your Web IDE:
  ```bash
  npm install @awesome.me/webawesome
  ```
- **Import-specific UI Components & CSS:**  
  Cherry-pick only the components and styles actually used:
  ```tsx
  import '@awesome.me/webawesome/dist/styles/webawesome.css'; // global styles
  import '@awesome.me/webawesome/dist/styles/themes/default.css'; // theme (set theme class on root if needed)
  import '@awesome.me/webawesome/dist/components/button/button.js';
  import '@awesome.me/webawesome/dist/components/input/input.js';
  // ...other components as needed
  ```

- **TypeScript Integration:**  
  - Add type definitions for custom elements/components by referencing:
    ```
    node_modules/@awesome.me/webawesome/dist/custom-elements-jsx.d.ts
    ```
  - Update your `tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "types": [
          "node_modules/@awesome.me/webawesome/dist/custom-elements-jsx.d.ts"
        ]
      }
    }
    ```
  - Extend JSX's IntrinsicElements for global project types:
    ```tsx
    import type { CustomElements, CustomCssProperties } from '@awesome.me/webawesome/dist/custom-elements-jsx.d.ts';
    declare module 'react' {
      namespace JSX {
        interface IntrinsicElements extends CustomElements {}
        interface CSSProperties extends CustomCssProperties {}
      }
    }
    ```

***

## 2. Usage in React 19

- **Custom Elements as JSX:**  
  React 19+ fully supports custom elements, so use Web Awesome components natively in JSX:
  ```tsx
  export function App() {
    return (
      <wa-button variant="brand" size="small">Click me</wa-button>
    );
  }
  ```
- **Register/await components:**  
  Await custom elements if you interact with them imperatively:
  ```tsx
  await customElements.whenDefined('wa-button'); // or use allDefined() to await all
  ```
- **Props and Boolean Attributes:**  
  Set props as attributes in JSX. For boolean props, their presence is enough: `<wa-checkbox checked />`
- **Events and Methods:**  
  Listen for standard and custom (`wa-*`) events using React's event handlers:
  ```tsx
  <wa-dialog onWaAfterShow={() => doSomething()}></wa-dialog>
  ```
  Use refs for imperative methods:
  ```tsx
  const inputRef = useRef<HTMLInputElement>(null);
  // ...later
  inputRef.current?.focus();
  ```
- **Slots:**  
  Use child/slot attribute in JSX for named slots:
  ```tsx
  <wa-button>
    <wa-icon slot="start" name="gear" variant="solid" />
    Settings
  </wa-button>
  ```

***

## 3. Customizing

- **Themes:**  
  Override theme CSS variables for tokens:
  ```css
  :root { --wa-color-surface-raised: var(--wa-color-neutral-95); }
  ```
- **Component styles:**  
  Scoped locally:
  ```css
  wa-avatar { --size: 6rem; }
  ```
  Or inline in JSX:
  ```tsx
  <wa-avatar style={{ '--size': '6rem' } as React.CSSProperties}></wa-avatar>
  ```
- **Custom States:**  
  Use `:state()` selector for component styling (see docs for supported states):
  ```css
  wa-checkbox:state(checked) { outline: dotted 2px tomato; }
  ```
- **CSS Parts:**  
  Deep component customization:
  ```css
  wa-button::part(icon) { color: red; }
  ```

***

## 4. Form Controls

- **Form Submission/Validation:**  
  Web Awesome form components act as native for validation/submission:
  ```tsx
  <form>
    <wa-input required pattern="[A-Z]+" />
    <wa-checkbox checked />
    <button type="submit">Submit</button>
  </form>
  ```
- **Custom Error Message:**  
  Use refs for imperative methods and set custom validity:
  ```tsx
  inputRef.current?.setCustomValidity('Error message');
  ```
- **Validation Styling:**  
  Use both browser pseudo-classes and Web Awesome custom states:
  - `:state(required)`, `:state(valid)`, `:state(invalid)` etc.

***

## 5. Localization

- **Per-Element Language and Direction:**  
  Set `lang` and `dir` on components in JSX:
  ```tsx
  <wa-button lang="es">Botón</wa-button>
  ```
- **Translation File Import:**  
  Dynamically import translations as needed:
  ```tsx
  import '/dist/translations/es.js';
  ```
- **Custom Translations (TypeScript-first):**  
  Copy `en.ts` and register your translation:
  ```ts
  import { registerTranslation } from 'path/to/webawesome.js';
  import type { Translation } from 'path/to/webawesome.js';

  const myTranslation: Translation = {
    $code: 'es',
    $name: 'Español',
    $dir: 'ltr',
    // ...translated terms
  };
  registerTranslation(myTranslation);
  ```
- **Fallback:**  
  Default is English (US).

***

## OPTIONAL

Enable **VS Code IntelliSense** as Web Awesome ships with code hints for custom elements.
In your project root, create a .vscode/settings.json file (or edit if present):

  JSON Structure to be added to .vscode/settings.json
      {
        "html.customData": [
          "./node_modules/@awesome.me/webawesome/dist/vscode.html-custom-data.json"
        ]
      }
  
  Restart VS Code to activate hints for components, attributes, and slots.

  For **TypeScript:**, ensure "types" extends relevant definitions, e.g. in tsconfig.json:

  JSON Structure to be added to tsconfig.json
      {
        "compilerOptions": {
          "types": [
            "./node_modules/@awesome.me/webawesome/dist/custom-elements-jsx.d.ts"
          ]
        }
      }

***


**Pro Tips for LLM/AI Agent Workflows:**
- Web Awesome ships with editor custom-data files for code completion (`vscode.html-custom-data.json`, `web-types.json`)—configure your IDE for better AI hints.
- Before programmatic manipulation, always `await customElements.whenDefined` for reliability.
- When automating, prefer explicit attributes/property settings per docs, validate events and named slots for every used component.
- Always reference individual components and styles for tree-shaking; avoid importing the entire bundle.

This guide ensures **React 19 + TypeScript** teams and developer AI agents can robustly leverage Web Awesome via NPM+Web IDE, with advanced IDE support, best practices for custom elements, and deeply reliable integration into modern React apps.[1]

[1](https://webawesome.com/docs/)