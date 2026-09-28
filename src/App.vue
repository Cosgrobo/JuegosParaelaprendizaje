<template>
  <router-view />
</template>

<style>
:root {
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  color: #172554;
  background: #f4f6ff;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  --color-ink: #172554;
  --color-primary: #4f46e5;
  --color-primary-dark: #3730a3;
  --color-accent: #f97316;
  --color-muted: #64748b;
  --color-surface: #ffffff;
  --color-page: #f4f6ff;
  --radius-card: 22px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: var(--color-page);
  color: var(--color-ink);
}

button,
input,
textarea,
select {
  font: inherit;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid #a5b4fc;
  outline-offset: 3px;
}
</style>
