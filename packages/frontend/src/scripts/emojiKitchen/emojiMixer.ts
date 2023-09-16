import * as data from './emojiData';

const mixEmojiUrl = (r, c) => {
	let padZeros = r < 20220500; // Revisions before 0522 had preceding zeros
	c[0] = c[0].split(/-/g).map(s => padZeros ? s.padStart(4, "0") : s).join("-u");
	c[1] = c[1].split(/-/g).map(s => padZeros ? s.padStart(4, "0") : s).join("-u");
	return `https://www.gstatic.com/android/keyboard/emojikitchen/${r}/u${c[0]}/u${c[0]}_u${c[1]}.png`;
};

const convertBase = (value, from_base, to_base) => {
	value = value.toString();
	var range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
	var from_range = range.slice(0, from_base);
	var to_range = range.slice(0, to_base);

	var dec_value = value.split('').reverse().reduce(function (carry, digit, index) {
		if (from_range.indexOf(digit) === -1) throw new Error('Invalid digit `' + digit + '` for base ' + from_base + '.');
		return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
	}, 0);

	var new_value = '';
	while (dec_value > 0) {
		new_value = to_range[dec_value % to_base] + new_value;
		dec_value = (dec_value - (dec_value % to_base)) / to_base;
	}
	return new_value || '0';
};

const hexEncodeEmoji = (chr) => {
	if (chr.length !== 1) {
		const hi = chr.charCodeAt(0);
		const lo = chr.charCodeAt(1);
		if (0xD800 <= hi && hi < 0xDC00 && 0xDC00 <= lo && lo < 0xE000) {
			return (0x10000 + (hi - 0xD800) * 0x400 + (lo - 0xDC00)).toString(16);
		}
		return ("000" + hi.toString(16)).slice(-4) + '-' + ("000" + lo.toString(16)).slice(-4);
	}
	else {
		return ("000" + chr.charCodeAt(0).toString(16)).slice(-4);
	}
};

const pairsMatchingMap = match => {
	const mv = match[0];
	let [d, c1, c2] = mv.split('.');
	c1 = data.points[convertBase(c1, 64, 10)];
	c2 = data.points[convertBase(c2, 64, 10)];
	d = data.revisions[convertBase(d, 64, 10)];

	return mixEmojiUrl(d, [c1, c2]);
};

export const mixEmoji = (emoji1, emoji2) => {
	const encordedEmoji1 = convertBase(data.points.indexOf(hexEncodeEmoji(emoji1)), 10, 64);
	const encordedEmoji2 = convertBase(data.points.indexOf(hexEncodeEmoji(emoji2)), 10, 64);
	return [
		...data.pairs.matchAll(new RegExp("^.*\\." + encordedEmoji1 + "\\." + encordedEmoji2 + "\\.$", "gm")),
		...data.pairs.matchAll(new RegExp("^.*\\." + encordedEmoji2 + "\\." + encordedEmoji1 + "\\.$", "gm"))
	].map(pairsMatchingMap).pop();
};
