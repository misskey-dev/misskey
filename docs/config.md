``` yaml
# サーバーのメンテナ情報
maintainer:
  # メンテナの名前
  name:

  # メンテナの連絡先(URLかmailto形式のURL)
  url:

# プライマリURL
url:

# セカンダリURL
secondary_url:

# 待受ポート
port:

# TLSの設定
https:
  # TLSを有効にするか否か
  enable: false

  key: null
  cert: null
  ca: null

# MongoDBの設定
mongodb:
  host: localhost
  port: 27017
  db: misskey
  user:
  pass:

# Redisの設定
redis:
  host: localhost
  port: 6379
  pass:

# reCAPTCHAの設定
recaptcha:
  site_key:
  secret_key:

# ServiceWrokerの設定
sw:
  # VAPIDの公開鍵
  public_key:

  # VAPIDの秘密鍵
  private_key:

```
