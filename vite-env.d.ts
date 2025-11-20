// /// <reference types="vite/client" />

// This file tells TypeScript that 'process.env' exists and has an API_KEY property.
// This prevents 'Cannot find name process' errors during 'npm run build' (tsc).
// Using 'var' instead of 'const' prevents "Cannot redeclare block-scoped variable" conflicts with Node types.
declare var process: {
  env: {
    [key: string]: string | undefined;
    API_KEY: string;
  }
};