import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { IonicVue } from '@ionic/vue'
import ItemListItem from '../../src/components/ItemListItem.vue'

describe('ItemListItem (browser mode)', () => {
  it('renders item name and price', async () => {
    const wrapper = mount(ItemListItem, {
      global: { plugins: [IonicVue] },
      props: {
        item: { id: 1, name: 'Coffee', price: 350, category: 'drink', code: 'ABCD0001' },
      },
    })
    expect(wrapper.text()).toContain('Coffee')
    expect(wrapper.text()).toContain('350')
  })
})
