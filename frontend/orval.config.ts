import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: '../openapi/openapi.yaml',
    output: {
      // NOTE: mode 'tags-split' emits per-tag dirs (e.g. src/api/items/items.ts);
      // no top-level src/api/index.ts barrel is created. Import from the per-tag path.
      target: 'src/api/index.ts',
      schemas: 'src/api/models',
      client: 'axios-functions',
      mode: 'tags-split',
      mock: {
        generators: [
          {
            type: 'msw',
            useExamples: true,
          },
        ],
      },
      override: {
        mutator: {
          path: 'src/api/axios.ts',
          name: 'request',
        },
      },
    },
  },
  apiZod: {
    input: '../openapi/openapi.yaml',
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: 'src/api/zod',
      fileExtension: '.zod.ts',
    },
  },
})
