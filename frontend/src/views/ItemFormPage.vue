<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1" />
        </ion-buttons>
        <ion-title>{{ editId != null ? 'Edit Item' : 'New Item' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <form @submit.prevent="onSubmit">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input
              data-testid="item-name"
              v-model="form.name"
              placeholder="Item name"
            />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Price</ion-label>
            <ion-input
              data-testid="item-price"
              type="number"
              v-model="form.price"
              placeholder="0"
            />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Category</ion-label>
            <ion-select data-testid="item-category" v-model="form.category" placeholder="Select">
              <ion-select-option value="food">food</ion-select-option>
              <ion-select-option value="drink">drink</ion-select-option>
              <ion-select-option value="other">other</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Code</ion-label>
            <ion-input
              data-testid="item-code"
              v-model="form.code"
              placeholder="ABCD1234"
            />
          </ion-item>
        </ion-list>

        <div v-if="formError" data-testid="item-form-error" style="color: red; padding: 8px 16px;">
          {{ formError }}
        </div>

        <div style="padding: 16px;">
          <ion-button expand="block" type="submit" data-testid="item-form-submit">
            {{ editId != null ? 'Update' : 'Create' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton,
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
} from '@ionic/vue'
import { useItem } from '../composables/useItem'
import { itemInputSchema } from '../validators/item'

const route = useRoute()
const router = useRouter()
const { item, loadItem, save } = useItem()

const editId = computed(() =>
  route.params.id != null && route.params.id !== '' ? Number(route.params.id) : null
)

const form = ref({
  name: '',
  price: '',
  category: '',
  code: '',
})

const formError = ref<string | null>(null)

onMounted(async () => {
  if (editId.value != null) {
    await loadItem(editId.value)
    if (item.value) {
      form.value.name = item.value.name
      form.value.price = String(item.value.price)
      form.value.category = item.value.category
      form.value.code = item.value.code
    }
  }
})

async function onSubmit() {
  formError.value = null
  const payload = {
    name: form.value.name,
    price: Number(form.value.price),
    category: form.value.category,
    code: form.value.code,
  }

  const result = itemInputSchema.safeParse(payload)
  if (!result.success) {
    formError.value = result.error.issues.map((i) => i.message).join(', ')
    return
  }

  await save(result.data, editId.value ?? undefined)
  router.replace('/tabs/tab1')
}
</script>
