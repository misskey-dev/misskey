# packages-private

`packages-private` は、CIなどで使用するためのユーティリティなどを格納する場所です。この配下にあるものは**プロダクションの `/packages`**の依存となるものではありません。

## パッケージ一覧

| パッケージ | 用途 |
| --- | --- |
| [`diagnostics-shared`](./diagnostics-shared) | 計測系パッケージが共有する統計・書式整形・V8 heap snapshot解析のユーティリティ |
| [`diagnostics-backend`](./diagnostics-backend) | バックエンドのメモリ使用量をbase/headで比較し、PRコメント用のMarkdownを生成する |
| [`diagnostics-frontend-browser`](./diagnostics-frontend-browser) | ヘッドレスChromeでフロントエンドを操作し、メモリ・ネットワーク等の指標をbase/headで比較する |
| [`diagnostics-frontend-bundle`](./diagnostics-frontend-bundle) | フロントエンドのビルド成果物のchunkサイズをbase/headで比較する |
| [`changelog-checker`](./changelog-checker) | `CHANGELOG.md` の追記内容を検証する |

## GitHub Actionsからの呼び出し方

ワークフロー側にロジックを持たせず、各パッケージのnpm scriptを呼ぶだけにしている。
CLIに渡すパスはすべて呼び出し側のカレントディレクトリ基準で解決されるため、
ワークフローからは `$GITHUB_WORKSPACE` / `$RUNNER_TEMP` を使った絶対パスを渡すこと。

```yaml
- name: Generate report
  working-directory: after
  run: >-
    pnpm --filter diagnostics-frontend-bundle run render-md
    "$GITHUB_WORKSPACE/before" "$GITHUB_WORKSPACE/after"
    "$REPORT_DIR/before-stats.json" "$REPORT_DIR/after-stats.json"
    "$REPORT_DIR/report.md"
```

base/head を比較する計測では、**head側のチェックアウトにあるハーネスで両方を計測する**
(計測コードの差分ではなくビルド成果物の差分だけが結果に出るようにするため)。
