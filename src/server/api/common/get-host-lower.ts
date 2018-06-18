import { toUnicode } from 'punycode';

export default (host: string) => {
	return toUnicode(host).toLowerCase();
};
