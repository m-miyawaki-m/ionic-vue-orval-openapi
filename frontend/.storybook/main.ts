import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/vue3-vite';
import type { Plugin } from 'vite';

// Light setup: component catalog / living design doc only.
// Extra init addons (Chromatic, onboarding, a11y, vitest) were removed to keep
// this OSS/local and decoupled from the L1 vitest config.

// Storybook v10 + Vite: @storybook/addon-docs's MDX plugin sets providerImportSource
// via import.meta.resolve(), which yields a file:// URL. Rollup can't resolve file://
// as a browser import. Observed breaking `build-storybook` on this Windows setup, so we
// redirect that URL to the real filesystem path. (Storybook's MDX builds on Linux/macOS
// without this; treat it as environment-scoped — remove only if confirmed unneeded.)
function mdxReactShimFix(): Plugin {
  const shimFileUrl = import.meta.resolve('@storybook/addon-docs/mdx-react-shim');
  const shimFilePath = fileURLToPath(shimFileUrl);
  return {
    name: 'storybook:mdx-react-shim-url-fix',
    enforce: 'pre',
    resolveId(id) {
      if (id === shimFileUrl) {
        return shimFilePath;
      }
    },
  };
}

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/vue3-vite",
  viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), mdxReactShimFix()];
    return config;
  },
};
export default config;
