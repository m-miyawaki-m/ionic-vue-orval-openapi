import type { StorybookConfig } from '@storybook/vue3-vite';

// Light setup: component catalog / living design doc only.
// Extra init addons (Chromatic, onboarding, a11y, vitest) were removed to keep
// this OSS/local and decoupled from the L1 vitest config.
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/vue3-vite"
};
export default config;
