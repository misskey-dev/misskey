declare const _LANGS_: string[];
declare const _COPYRIGHT_: string;
declare const _VERSION_: string;
declare const _CODENAME_: string;
declare const _ENV_: string;

const address = new URL(location.href);

export const instanceHost = location.pathname.split("/")[1]

if (!/[a-z\.0-9]+/.test(instanceHost)) {
	alert("不正なホストです。トップにリダイレクトします");
	location.href = "/"
	throw "please dont execute next scripts"
}

if (localStorage.getItem("allowed-by-user:" + instanceHost) == null) {
	const userConsent = confirm(`注意! あなたは misskey-v11-front 「${location.origin}」 から ${instanceHost} にアクセスしようとしています。\n${instanceHost} の運営者に悪意があった場合、あなたが ${location.origin} でログインしている全インスタンスのアクセストークンを盗まれるおそれがあります。\n本当に接続しますか?`)
	if (userConsent == false) {
		location.href = "/"
		throw "please dont execute next scripts"
	}
	localStorage.setItem("allowed-by-user:" + instanceHost, "yes")
}

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin+"/" + instanceHost;
export const apiUrl = `https://${instanceHost}/api`;
export const wsUrl = `wss://${instanceHost}/streaming`;
export const lang = localStorage.getItem('lang') || window.lang; // windowは後方互換性のため
export const langs = _LANGS_;
export const locale = JSON.parse(localStorage.getItem('locale'));
export const copyright = _COPYRIGHT_;
export const version = _VERSION_;
export const codename = _CODENAME_;
export const env = _ENV_;
