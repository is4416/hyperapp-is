# Navigator
Jsonファイルを閲覧するためのファインダー  
どういった構造の JSON ファイルでも対応できるよう作成しています

## NavigatorFinder
NavigatorFinderコンポーネント

`currentKeys` に `NavigatorItem` までのパスを設定しなくてはならないため  
`JSON` ファイルから `convertJsonToNavigatorItem` により、作成してください

```ts
export const NavigatorFinder = function <S> (
	props: {
		state         : S
		currentKeys   : Keys_NavigatorItem
		columns      ?: (directory: NavigatorItem | undefined) => NavigatorColumn[]
		maxItemsCount?: number
		itemClick    ?: (state: S, item: NavigatorItem) => S | [S, Effect<S>]
		afterRender  ?: (props: {
			state     : S
			current  ?: NavigatorItem
			extension?: Record<string, any>
		}, vnode: VNode<S>) => VNode<S>
		extension   ?: Record<string, any>
		[key: string]: any
	}
): VNode<S>
```

| props         | 説明                         | 備考       |
| ---           | ---                          | ---        |
| state         | ステート                     | 必須       |
| currentKeys   | NavigatorItem までのパス     | 必須       |
| columns       | 表示項目を出力する関数       | オプション |
| maxItemsCount | 最大アイテム表示数           | オプション |
| itemClick     | クリックイベント             | オプション |
| afterRender   | Render Hook                  | オプション |
| extension     | 拡張オプション               | オプション |

---

コンポーネントは、概ね次の形になります

```html
<div id={id}>
	<div class="toolBar">未実装</div>
	<ol>{ parentItems.map(parentItem => (<li>{ parentItem.name }</li>)) }</ol>
	<table>
		<thead>
			<tr>
				<th>name</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>{ item.name }</td>
			</tr>
		</tbody>
	</table>
	<div class="statusBar">未実装</div>
</div>
```

---

## convertJsonToNavigatorItem
`JSON` からコンポーネントで使用する `NavigatorItem` に変換する関数です  
`getEntries` により、任意形式の `JSON` ファイルからの変換が可能となっています  
しかし `getEntries` を作成するコストが若干必要となります

```ts
export const convertJsonToNavigatorItem = function <D> (
	props: {
		parent     : NavigatorItem | null
		name       : string
		data       : D
		getEntries : (data: D, depth: number) => JsonEntry<D>[]
		isNode     : boolean
		depth     ?: number
		extension ?: (item: NavigatorItem, data: D, depth: number) => Record<string, any> | undefined
	}
): NavigatorItem {
```

| props      | 説明                          | 備考                                                   |
| ---        | ---                           | ---                                                    |
| parent     | 親アイテム                    | `JSON` からの変換では `null` を指定します              |
| name       | フォルダ名                    |                                                        |
| data       | `JSON` データ                 |                                                        |
| getEntries | `JSON` データの分類を返す関数 | この関数により、構造化が行われます                     |
| isNode     | 子アイテムを追加する          | 現在のところ `TRUE` を設定してください                 |
| depth      | 階層の深さ                    |                                                        |
| extension  | 拡張オプション                | `NavigatorItem.extension` に値を追加することができます |

---

## JsonEntry
`getEntries` で返す値は、以下の配列となります

```ts
export interface JsonEntry <D> {
	name  : string
	data  : D
	isNode: boolean
}
```

| props  | 説明     |
| ---    | ---      |
| name   | 名前     |
| data   | データ   |
| isNode | ノードか |

`getEntries` は `JSON` の構造によってユーザーが作成する必要があります  
以下のように実装してください
```ts
const getEntries = (data: Record<string, any>, deptch: number) => {
	return Object.Keys(data).map(key => {
		const obj = data[key]
		return {
			name  : key,
			data  : obj,
			isNode: typeof obj === "object" && Array.isArray(obj)
		}
	})
}
```

---

## NavigatorColumn
`NavigatorColumn` を設定することにより、任意の項目をリストに作成することができます

```ts
export interface NavigatorColumn {
	name: string
	val : (item: NavigatorItem) => any
}
```

| props | 説明                 |
| ---   | ---                  |
| name  | ヘッダに表示する文字 |
| val   | 値を表示する関数     |

`columns` は初期値として、フォルダに含まれる全てのプロパティを表示するよう作成しています  
拡張例のサンプルが、コードにコメントアウトして記載されています
