import { toUnicode } from 'punycode';

export default (host: string) => {
	if (host == null) return null;
	return toUnicode(host).toLowerCase();
};
