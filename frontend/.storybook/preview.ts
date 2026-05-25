import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { IonicVue } from '@ionic/vue'

/* Ionic components rely on these being registered, like in src/main.ts */
import '@ionic/vue/css/core.css'

setup((app) => {
  app.use(IonicVue)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
