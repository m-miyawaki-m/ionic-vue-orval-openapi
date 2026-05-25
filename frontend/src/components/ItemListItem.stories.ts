import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ItemListItem from './ItemListItem.vue'

// Component catalog / living design doc for the L2/L3 row component.
const meta: Meta<typeof ItemListItem> = {
  title: 'Components/ItemListItem',
  component: ItemListItem,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof ItemListItem>

export const Drink: Story = {
  args: {
    item: { id: 1, name: 'Coffee', price: 350, category: 'drink', code: 'ABCD0001' },
  },
}

export const Food: Story = {
  args: {
    item: { id: 2, name: 'Sandwich', price: 480, category: 'food', code: 'ABCD0002' },
  },
}

export const LongName: Story = {
  args: {
    item: {
      id: 3,
      name: 'Premium Single-Origin Cold Brew Coffee 1L Bottle',
      price: 1200,
      category: 'drink',
      code: 'ABCD0003',
    },
  },
}
