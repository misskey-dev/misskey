# Misskey API

您可以使用Misskey API来开发Misskey客户端、与Misskey链接的Web服务、Bot等应用（以下称为“应用程序”）。 另外还有一个流式API，因此还可以用来创建实时性的应用程序。

开始使用API前​​，您首先需要获取访问令牌。 本文档将引导您完成获取访问令牌的步骤，然后介绍API的基本使用方法。

## 访问令牌的获取
总的来说，API请求需要访问令牌。 获取方式则根据请求的API或者非特定用户所使用的应用程序而有所不同。

* 对于前者：转到[“手动发放自己的访问令牌”](#自分自身のアクセストークンを手動発行する)
* 对于后者：转到[“请求应用程序用户发放访问令牌”](#アプリケーション利用者にアクセストークンの発行をリクエストする)

### 手动发放自己的访问令牌
您可以在“设置 > API”中发放自己的访问令牌。

[转到“API使用方法”](#APIの使い方)

### 请求应用程序用户发放访问令牌
要获取应用程序用户的访问令牌，请按照以下步骤请求发放。

#### Step 1

生成UUID。以下将其称为会话ID。

> 此会话ID需要每次重新生成，请勿重复使用。

#### Step 2

在用户的浏览器中显示`{_URL_}/miauth/{session}`。将`{session}`的部分替换为会话ID。
> 例: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

显示时，可以在URL中设置一些选项作为查询参数：
* `name` ... 应用程序名称
    * > 例: `MissDeck`
* `icon` ... 应用程序图标URL
    * > 例: `https://missdeck.example.com/icon.png`
* `callback` ... 认证后重定向的URL
    * > 例: `https://missdeck.example.com/callback`
    * 重定向时，会话ID将添加查询参数`session`
* `permission` ... 应用程序要求的权限
    * > 例: `write:notes,write:following,read:drive`
    * 要求的权限需要以`,`分隔
    * 您可以在[API参考](/api-doc)中确认您所拥有的权限。

#### Step 3
用户允许发行后，对`{_URL_}/api/miauth/{session}/check`的POST请求所返回的是一个包含访问令牌的JSON格式的响应。

响应中包含的属性：
* `token` ... 用户的访问令牌
* `user` ... 用户信息

[转到“API使用方法”](#APIの使い方)

## API使用方法
**所有API均为POST，并且请求/响应均为JSON格式。不是REST。** 访问令牌包含在请求中，参数名为`i`。

* [API 参考](/api-doc)
* [流式API](./stream)
