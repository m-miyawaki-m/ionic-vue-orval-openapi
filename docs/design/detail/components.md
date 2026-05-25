# コンポーネント一覧・定義（詳細設計）

再利用UI部品。ツリーは `architecture/component-tree.puml`、ストーリーは Storybook `Components/ItemListItem`。

## 一覧

| コンポーネント | 責務 | 使用画面 | stories |
|---|---|---|---|
| `ItemListItem.vue` | Item 1件のリスト行表示（name/category/price） | TabItemsPage（一覧） | ✅ `ItemListItem.stories.ts`（Drink/Food/LongName） |
| `ExploreContainer.vue` | Ionic 雛形の名残（実機能なし） | — | — |

> 画面（`views/`）は画面単位コンポーネント。ここでは「再利用部品」を扱う。L2(Component層)の主対象は `ItemListItem`。

## コンポーネント定義: ItemListItem

```vue
<ion-item button data-testid="item-row" @click="$emit('select', item.id)">
  <ion-label><h2>{{ item.name }}</h2><p>{{ item.category }} / ¥{{ item.price }}</p></ion-label>
</ion-item>
```

| I/F | 定義 | 備考 |
|---|---|---|
| props | `item: Item` | 表示対象（`api/models` の Item） |
| emits | `select(id: number)` | 行タップで親へ。親（TabItemsPage）が `router.push('/items/'+id)` |
| slots | なし | |
| testid | `item-row` | E2E/CTのアンカー |
| 依存 | `IonItem`, `IonLabel`, `Item` 型 | プレゼンテーションのみ（状態/通信なし） |

設計意図: ロジックを持たない純表示部品にし、選択は emit で親に委譲（CTでマウントしやすく、L3で見た目回帰しやすい）。
props はランナー↔ブラウザ境界をまたぐためシリアライズ可能（プレーンな Item）。
