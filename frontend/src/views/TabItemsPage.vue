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
        <ItemListItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          @select="goDetail"
        />
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
  IonList,
} from '@ionic/vue'
import { useItems } from '../composables/useItems'
import ItemListItem from '../components/ItemListItem.vue'

const router = useRouter()
const { items, loading, error, load } = useItems()
onMounted(load)

function goDetail(id: number) {
  router.push('/items/' + id)
}
</script>
