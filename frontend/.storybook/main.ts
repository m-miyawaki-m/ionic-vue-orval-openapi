import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/vue3-vite';
import type { Plugin } from 'vite';

// Light setup: component catalog / living design doc only.
// Extra init addons (Chromatic, onboarding, a11y, vitest) were removed to keep
// this OSS/local and decoupled from the L1 vitest config.

// Windows fix: @storybook/addon-docs mdx-plugin sets providerImportSource via
// import.meta.resolve(), which returns a file:// URL on Windows. Rollup cannot
// resolve file:// URLs as browser imports. This plugin intercepts those IDs and
// redirects them to the real package path so Vite can bundle them normally.
function mdxReactShimFix(): Plugin {
  const shimFileUrl = import.meta.resolve('@storybook/addon-docs/mdx-react-shim');
  const shimFilePath = fileURLToPath(shimFileUrl);
  return {
    name: 'storybook:mdx-react-shim-windows-fix',
    enforce: 'pre',
    resolveId(id) {
      if (id === shimFileUrl || id === shimFilePath) {
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
    config.plugins ??= [];
    (config.plugins as Plugin[]).push(mdxReactShimFix());
    return config;
  },
};
export default config;
