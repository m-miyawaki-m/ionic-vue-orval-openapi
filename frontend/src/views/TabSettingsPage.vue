<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" data-testid="settings-page">
      <ion-list>
        <ion-item>
          <ion-label>Dark Mode</ion-label>
          <ion-toggle
            slot="end"
            data-testid="settings-dark"
            :checked="darkEnabled"
            @ionChange="toggleDark"
          />
        </ion-item>
        <ion-item>
          <ion-button
            expand="block"
            color="danger"
            data-testid="settings-logout"
            @click="handleLogout"
          >
            Logout
          </ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonToggle, IonButton,
} from '@ionic/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const darkEnabled = ref(document.documentElement.classList.contains('dark'))

function toggleDark() {
  darkEnabled.value = !darkEnabled.value
  document.documentElement.classList.toggle('dark', darkEnabled.value)
}

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>
