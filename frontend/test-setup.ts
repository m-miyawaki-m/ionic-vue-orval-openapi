import { config } from '@vue/test-utils'

// Ionic Web Components は jsdom で未定義のため、L1ではcomposable中心にテストする
config.global.stubs = {}
