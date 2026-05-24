<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1" />
        </ion-buttons>
        <ion-title>Item Detail</ion-title>
        <ion-buttons slot="end">
          <ion-button data-testid="item-edit" @click="onEdit">Edit</ion-button>
          <ion-button data-testid="item-delete" color="danger" @click="onDelete">Delete</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading">Loading...</div>
      <div v-else-if="item" data-testid="item-detail">
        <ion-list>
          <ion-item>
            <ion-label>
              <p>Name</p>
              <h2>{{ item.name }}</h2>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <p>Category</p>
              <h2>{{ item.category }}</h2>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <p>Price</p>
              <h2>¥{{ item.price }}</h2>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <p>Code</p>
              <h2>{{ item.code }}</h2>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonBackButton,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { useItem } from '../composables/useItem'

const route = useRoute()
const router = useRouter()
const { item, loading, loadItem, remove } = useItem()

const id = Number(route.params.id)

onMounted(() => loadItem(id))

function onEdit() {
  router.push('/items/' + id + '/edit')
}

async function onDelete() {
  await remove(id)
  router.replace('/tabs/tab1')
}
</script>
