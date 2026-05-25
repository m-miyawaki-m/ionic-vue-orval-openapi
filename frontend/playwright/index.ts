import { beforeMount } from '@playwright/experimental-ct-vue/hooks'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'

beforeMount(async ({ app }) => {
  app.use(IonicVue)
})
