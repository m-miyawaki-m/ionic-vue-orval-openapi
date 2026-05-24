<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Items</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" data-testid="items-loading">Loading...</div>
      <ion-list v-else data-testid="items-list">
        <ion-item v-for="item in items" :key="item.id">
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
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { useItems } from '../composables/useItems'

const { items, loading, load } = useItems()
onMounted(load)
</script>
