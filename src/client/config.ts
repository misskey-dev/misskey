import { clientDb, entries } from './db';
import { fromEntries } from '../prelude/array';

declare const _LANGS_: string[];
declare const _VERSION_: string;
declare const _ENV_: string;

const address = new URL(location.href);
const siteName = (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = localStorage.getItem('lang');
export const langs = _LANGS_;
export const getLocale = async () => fromEntries((await entries(clientDb.i18nContexts)) as [string, string][]);
export const version = _VERSION_;
export const env = _ENV_;
export const instanceName = siteName === 'Misskey' ? null : siteName;
