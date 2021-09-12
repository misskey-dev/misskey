GitHub Actionsを使用してDocker Hubへpushする方法
================================================================

[/.github/workflows/docker.yml](/.github/workflows/docker.yml) に  
GitHub ActionによりDocker Hubへpushするワークフローが記述されています。

オリジナルリポジトリでは、リリースされたタイミングで `latest`, `<リリース名>` それぞれのタグでDocker Hubにpushされます。  
※ Docker Hub に`<ブランチ名>`のようなタグがあるかもしれませんが、こちらは自動push対象ではありません。

Fork先でこのワークフローを実行すると失敗します。

以下では、Fork先で自分のDocker Hubリポジトリにpushするようにする方法を記述します。

## 自分のDocker Hubリポジトリにpushするように設定する方法

1. Docker Hubでリポジトリを作成します。
2. ワークフローファイルの [images](https://github.com/misskey-dev/misskey/blob/53f3b779bf16abcda4f6e026c51384f3b8fbcc62/.github/workflows/docker.yml#L20) を作成したリポジトリに置き換えます。
3. GitHubにて [暗号化されたシークレット](https://docs.github.com/ja/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) を作成します。  
   作成が必要なのは `DOCKER_USERNAME` と `DOCKER_PASSWORD` で、それぞれDocker Hubのユーザーとパスワードになります。

## pushする方法

上記設定によりリリース時に自動的にDocker Hubにpushされるようになります。  
具体的には、GitHubのリリース機能でリリースしたタイミングで `latest`, `<リリース名>` それぞれのタグでDocker Hubにpushされます。

また、GitHub上から手動でpushすることも出来ます。  
それを行うには、Actions => Publish Docker image => Run workflow からbranchを選択してワークフローを実行します。  
ただし、この場合作成されるタグは`<ブランチ名>`になります。
