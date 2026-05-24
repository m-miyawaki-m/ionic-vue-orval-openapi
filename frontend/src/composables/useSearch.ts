import { ref } from 'vue'
import type { Item } from '../api/models'
import { searchItems } from '../api/items/items'

export function useSearch() {
  const query = ref('')
  const results = ref<Item[]>([])
  const loading = ref(false)
  async function search(q: string) {
    query.value = q
    if (!q) { results.value = []; return }
    loading.value = true
    try { results.value = await searchItems({ q }) } finally { loading.value = false }
  }
  return { query, results, loading, search }
}
