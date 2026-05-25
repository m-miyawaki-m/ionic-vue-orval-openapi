import { test, expect } from '@playwright/experimental-ct-vue'
import ItemListItem from '../../src/components/ItemListItem.vue'

test('renders item name and price', async ({ mount }) => {
  const component = await mount(ItemListItem, {
    props: { item: { id: 1, name: 'Coffee', price: 350, category: 'drink', code: 'ABCD0001' } },
  })
  await expect(component).toContainText('Coffee')
  await expect(component).toContainText('350')
})
