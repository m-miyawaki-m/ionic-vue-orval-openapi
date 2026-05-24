<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Search</ion-title>
        <ion-buttons slot="end">
          <ion-button data-testid="search-scan" @click="router.push('/scan')">Scan</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-searchbar
        data-testid="search-input"
        :value="query"
        @ionInput="onInput"
        @ionChange="onInput"
        placeholder="Search items..."
      />
      <div v-if="query && results.length === 0 && !loading" data-testid="search-empty">
        No results found.
      </div>
      <ion-list v-if="results.length > 0" data-testid="search-results">
        <ion-item
          v-for="item in results"
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
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonSearchbar,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { useSearch } from '../composables/useSearch'

const router = useRouter()
const { query, results, loading, search } = useSearch()

function onInput(event: CustomEvent) {
  const value = (event.detail?.value as string) ?? ''
  search(value)
}
</script>
