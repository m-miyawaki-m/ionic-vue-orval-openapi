<template>
  <ion-item button data-testid="item-row" @click="$emit('select', item.id)">
    <ion-label>
      <h2>{{ item.name }}</h2>
      <p>{{ item.category }} / ¥{{ item.price }}</p>
    </ion-label>
  </ion-item>
</template>
<script setup lang="ts">
import { IonItem, IonLabel } from '@ionic/vue'
import type { Item } from '../api/models'
defineProps<{ item: Item }>()
defineEmits<{ (e: 'select', id: number): void }>()
</script>
