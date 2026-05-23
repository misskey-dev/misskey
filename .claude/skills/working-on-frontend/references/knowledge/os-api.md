# `os.*` UI ヘルパー

[`packages/frontend/src/os.ts`](../../../../../packages/frontend/src/os.ts) で公開されている UI 操作 API の一覧。**ブラウザ標準の `window.alert()` / `window.confirm()` / `window.prompt()` を直接呼ばない**。これらは Misskey のテーマ / アクセシビリティ / モーダルレイヤと整合しないため。

## 主要 API

| 関数 | 用途 |
|---|---|
| `os.alert({ type, title?, text })` | 単方向アラート |
| `os.confirm({ type, title, text })` | yes/no 確認 (`{ canceled }` を返す) |
| `os.toast(message)` | 一時通知 |
| `os.popup(component, props, handlers)` | 任意コンポーネントの非同期ポップアップ |
| `os.popupMenu(items, anchor?)` | コンテキストメニュー |
| `os.contextMenu(items, ev)` | 右クリックメニュー |
| `os.form(title, fields)` | フォームダイアログ |
| `os.apiWithDialog(endpoint, data)` | API 呼出し + エラー時ダイアログ表示 |
| `os.success()` / `os.waiting()` | 成功 / ローディング表示 |

## 使用例

### `os.alert` (単方向通知)

```ts
await os.alert({
	type: 'info',
	text: i18n.ts.savedSuccessfully,
});
```

`type` は `'info'` / `'warning'` / `'error'` / `'question'` / `'success'`。

### `os.confirm` (yes/no 確認)

```ts
const { canceled } = await os.confirm({
	type: 'warning',
	text: i18n.ts._notes.deleteConfirm,
});
if (canceled) return;
// 削除処理
```

`canceled === true` のとき何もしない、というパターンが頻出。

### `os.toast` (一時通知)

```ts
os.toast(i18n.ts.deleted);
```

成功通知などの軽い fire-and-forget なフィードバック。

### `os.popup` (任意コンポーネント)

```ts
const { dispose } = os.popup(MkUserSelectDialog, {
	includeSelf: false,
}, {
	ok: (user) => {
		// ...
		dispose();
	},
	cancel: () => {
		dispose();
	},
});
```

カスタムダイアログを開く場合は、コンポーネント (props / emits) を `os.popup` で起動する。`dispose()` で閉じる。

### `os.apiWithDialog` (API + 自動エラーダイアログ)

```ts
const result = await os.apiWithDialog('notes/create', {
	text: 'hello',
});
// 成功時: result は API レスポンス
// 失敗時: 自動でエラーダイアログを表示 (例外を投げない)
```

通常の `misskeyApi(...)` だと自前でエラーハンドリングが必要だが、`apiWithDialog` は失敗時に自動で `os.alert({ type: 'error', ... })` を表示してくれる。

## なぜブラウザ標準 UI を使わないか

- `window.alert()` は Misskey のテーマ (ダークモード / カスタムテーマ) に追従しない
- `window.confirm()` はキーボード操作・focus trap・i18n のいずれも Misskey の規約と整合しない
- `window.prompt()` の入力 UI も同じ
- ブラウザ依存の表示揺れ (Firefox / Safari / Chrome で見た目が違う)
- vue-component-reviewer から指摘される

代わりに `os.alert` / `os.confirm` / `os.form` / `os.popup` を使う。

## 参照ファイル

- [packages/frontend/src/os.ts](../../../../../packages/frontend/src/os.ts) — 全 API の実装
- 既存のダイアログ系コンポーネント: `MkDialog.vue` (alert / confirm はこれを再利用)、`MkFormDialog.vue` 等
