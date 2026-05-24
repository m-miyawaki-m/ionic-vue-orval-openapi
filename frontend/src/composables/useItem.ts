import { ref } from 'vue'
import type { Item, ItemInput } from '../api/models'
import { getItem, createItem, updateItem, deleteItem } from '../api/items/items'

export function useItem() {
  const item = ref<Item | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function loadItem(id: number) {
    loading.value = true
    error.value = null
    try {
      item.value = await getItem(id)
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  async function save(input: ItemInput, id?: number) {
    return id == null ? createItem(input) : updateItem(id, input)
  }

  async function remove(id: number) {
    return deleteItem(id)
  }

  return { item, loading, error, loadItem, save, remove }
}
