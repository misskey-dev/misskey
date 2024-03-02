import * as fs from 'fs';
import { miLocalStorage } from './local-storage';
// @ts-ignore

const address = new URL(location.href);
const siteName = (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement).content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = miLocalStorage.getItem('lang');
export const langs = _LANGS_;
// @ts-ignore
export let locale = JSON.parse(miLocalStorage.getItem('locale'));

export const version = _VERSION_;

// metaAPIを叩いてbuildHashを取得する
const response: { buildHash: string } = await window
  .fetch(`${apiUrl}/meta`, {
    method: 'POST',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .catch(() => {
    console.error('Failed to fetch meta');
  })
  .then((res) => res.json());

export const buildHash = response.buildHash || _VERSION_;

export const instanceName = siteName === 'Misskey' ? host : siteName;
export const ui = miLocalStorage.getItem('ui');
// @ts-ignore
export const debug = miLocalStorage.getItem('debug') === 'true';

export function updateLocale(newLocale) {
  locale = newLocale;
}
