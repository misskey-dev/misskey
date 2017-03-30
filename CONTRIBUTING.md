# Contribution guide
:v: Misskeyへの貢献ありがとうございます。 :v:

## Issueの報告
新機能の提案や不具合の報告は https://github.com/syuilo/misskey/issues で管理しています。
Issueを作成する前に、既に同じIssueが作成されていないかご確認ください。
もし既にIssueが作成されている場合は、既存のIssueにコメントをしたりリアクションをするようお願いします。

## Issueの解決
[pr-welcomeのラベルがついているIssue](https://github.com/syuilo/misskey/labels/pr-welcome)
の解決を目的としたPull Requestを作成してくださると非常にありがたいです。

## 翻訳の改善
ソースコード中の `%i18n:id%` という形の文字列は、言語ファイルの対応するテキストに置換されます。
言語ファイルは /locales ディレクトリに存在します。

## ドキュメントの編集
現在Misskeyはドキュメントが大きく不足しています。
ドキュメントは /docs ディレクトリに存在します。

## テストの追加
現在Misskeyはテストが大きく不足しています。
テストコードは /test ディレクトリに存在します。

## 自動テスト及び自動リリース
Travis CIで行っています。
設定ファイルは /.travis に存在します。
