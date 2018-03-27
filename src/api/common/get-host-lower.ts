import { toUnicode } from 'punycode';

export default host => {
	return toUnicode(host).replace(/[A-Z]+/, match => match.toLowerCase());
};
