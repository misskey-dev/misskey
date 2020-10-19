import { clientDb, entries } from './db';

const address = new URL(location.href);
const siteName = (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = localStorage.getItem('lang');
export const langs = _LANGS_;
export const getLocale = async () => Object.fromEntries((await entries(clientDb.i18n)) as [string, string][]);
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' ? null : siteName;
export const deckmode = localStorage.getItem('deckmode') === 'true';
