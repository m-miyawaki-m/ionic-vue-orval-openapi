<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Login</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <ion-input label="Username" label-placement="stacked" data-testid="login-username" v-model="username" />
      <ion-input label="Password" label-placement="stacked" type="password" data-testid="login-password" v-model="password" />
      <div v-if="error" data-testid="login-error" class="error">{{ error }}</div>
      <ion-button expand="block" data-testid="login-submit" @click="submit">Sign in</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue'
import { loginSchema } from '../validators/auth'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

async function submit() {
  error.value = ''
  const parsed = loginSchema.safeParse({ username: username.value, password: password.value })
  if (!parsed.success) { error.value = 'Invalid input'; return }
  try {
    await auth.login(username.value, password.value)
    router.replace('/tabs/tab1')
  } catch (e) {
    error.value = 'Login failed'
  }
}
</script>
<style scoped>.error { color: var(--ion-color-danger); }</style>
