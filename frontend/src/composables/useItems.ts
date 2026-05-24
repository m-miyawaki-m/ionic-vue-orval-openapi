import { ref } from 'vue'
import type { Item } from '../api/models'
import { listItems } from '../api/items/items'

export function useItems() {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listItems()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, load }
}
