<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Items</ion-title>
        <ion-buttons slot="end">
          <ion-button data-testid="items-new" @click="router.push('/items/new')">New</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" data-testid="items-loading">Loading...</div>
      <div v-else-if="error" data-testid="items-error">Error loading items.</div>
      <div v-else-if="items.length === 0" data-testid="items-empty">No items found.</div>
      <ion-list v-else data-testid="items-list">
        <ion-item
          v-for="item in items"
          :key="item.id"
          button
          @click="router.push('/items/' + item.id)"
        >
          <ion-label>
            <h2>{{ item.name }}</h2>
            <p>{{ item.category }} / ¥{{ item.price }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { useItems } from '../composables/useItems'

const router = useRouter()
const { items, loading, error, load } = useItems()
onMounted(load)
</script>
