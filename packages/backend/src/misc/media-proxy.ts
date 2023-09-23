import { md5 } from './hash.js';

export const getProxySign = (targetUrl: string, signKey: string, origin: string): string => {
	return md5(`${targetUrl}_${signKey}_${origin}`);
};
