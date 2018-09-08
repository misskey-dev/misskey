declare const _LANG_: string;
declare const _LANGS_: string;
declare const _THEME_COLOR_: string;
declare const _COPYRIGHT_: string;
declare const _VERSION_: string;
declare const _CODENAME_: string;
declare const _ENV_: string;
declare const _NAME_: string;

const address = new URL(location.href);

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');
export const lang = _LANG_;
export const langs = _LANGS_;
export const themeColor = _THEME_COLOR_;
export const copyright = _COPYRIGHT_;
export const version = _VERSION_;
export const codename = _CODENAME_;
export const env = _ENV_;
export const name = _NAME_;
