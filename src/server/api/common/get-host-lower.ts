import { toUnicode } from 'punycode';

export default host => {
	return toUnicode(host).toLowerCase();
};
