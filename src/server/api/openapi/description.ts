import config from '../../../config';
import endpoints from '../endpoints';
import * as locale from '../../../../locales/';
import { fromEntries } from '../../../prelude/array';
import { kinds as kindsList } from '../kinds';

export interface IKindInfo {
	endpoints: string[];
	descs: { [x: string]: string; };
}

export function kinds() {
	const kinds = fromEntries(
		kindsList
			.map(k => [k, {
					endpoints: [],
					descs: fromEntries(
						Object.keys(locale)
							.map(l => [l, locale[l]._permissions[k] as string] as [string, string])
						) as { [x: string]: string; }
				}] as [ string, IKindInfo ])
			) as { [x: string]: IKindInfo; };

	const errors = [] as string[][];

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		if (endpoint.meta.kind) {
			const kind = endpoint.meta.kind;
			if (kind in kinds) kinds[kind].endpoints.push(endpoint.name);
			else errors.push([kind, endpoint.name]);
		}
	}

	if (errors.length > 0) throw Error('\n  ' + errors.map((e) => `Unknown kind (permission) "${e[0]}" found at ${e[1]}.`).join('\n  '));

	return kinds;
}

export function getDescription(lang = 'ja-JP'): string {
	const permissionTable = (Object.entries(kinds()) as [string, IKindInfo][])
		.map(e => `|${e[0]}|${e[1].descs[lang]}|${e[1].endpoints.map(f => `[${f}](#operation/${f})`).join(', ')}|`)
		.join('\n');

	const descriptions = {
		'ja-JP': `**Misskey is a decentralized microblogging platform.**

# Usage
**APIはすべてPOSTでリクエスト/レスポンスともにJSON形式です。**
一部のAPIはリクエストに認証情報(APIキー)が必要です。リクエストの際に\`i\`というパラメータでAPIキーを添付してください。

## 自分のアカウントのAPIキーを取得する
「設定 > API」で、自分のAPIキーを取得できます。

> アカウントを不正利用される可能性があるため、このトークンは第三者に教えないでください(アプリなどにも入力しないでください)。

## アプリケーションとしてAPIキーを取得する
直接ユーザーのAPIキーをアプリケーションが扱うのはセキュリティ上のリスクがあるので、
アプリケーションからAPIを利用する際には、アプリケーションとアプリケーションを利用するユーザーが結び付けられた専用のAPIキーを発行します。

### 1.アプリケーションを登録する
まず、あなたのアプリケーションやWebサービス(以後、あなたのアプリと呼びます)をMisskeyに登録します。
[デベロッパーセンター](/dev)にアクセスし、「アプリ > アプリ作成」からアプリを作成してください。

登録が済むとあなたのアプリのシークレットキーが入手できます。このシークレットキーは後で使用します。

> アプリに成りすまされる可能性があるため、極力このシークレットキーは公開しないようにしてください。</p>

### 2.ユーザーに認証させる
アプリを使ってもらうには、ユーザーにアカウントへのアクセスの許可をもらう必要があります。

認証セッションを開始するには、[${config.apiUrl}/auth/session/generate](#operation/auth/session/generate) へパラメータに\`appSecret\`としてシークレットキーを含めたリクエストを送信します。
レスポンスとして認証セッションのトークンや認証フォームのURLが取得できるので、認証フォームのURLをブラウザで表示し、ユーザーにフォームを提示してください。

あなたのアプリがコールバックURLを設定している場合、
ユーザーがあなたのアプリの連携を許可すると設定しているコールバックURLに\`token\`という名前でセッションのトークンが含まれたクエリを付けてリダイレクトします。

あなたのアプリがコールバックURLを設定していない場合、ユーザーがあなたのアプリの連携を許可したことを(何らかの方法で(たとえばボタンを押させるなど))確認出来るようにしてください。

### 3.アクセストークンを取得する
ユーザーが連携を許可したら、[${config.apiUrl}/auth/session/userkey](#operation/auth/session/userkey) へリクエストを送信します。

上手くいけば、認証したユーザーのアクセストークンがレスポンスとして取得できます。おめでとうございます！

アクセストークンが取得できたら、*「ユーザーのアクセストークン+あなたのアプリのシークレットキーをsha256したもの」*をAPIキーとして、APIにリクエストできます。

APIキーの生成方法を擬似コードで表すと次のようになります:
\`\`\` js
const i = sha256(userToken + secretKey);
\`\`\`

# Permissions
|Permisson (kind)|Description|Endpoints|
|:--|:--|:--|
${permissionTable}
`
	} as { [x: string]: string };
	return lang in descriptions ? descriptions[lang] : descriptions['ja-JP'];
}
