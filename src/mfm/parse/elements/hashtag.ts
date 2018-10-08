/**
 * Hashtag
 */

export type TextElementHashtag = {
	type: 'hashtag'
	content: string
	hashtag: string
};

export default function(text: string, i: number) {
	if (!(/^\s#[^\s\.,]+/.test(text) || (i == 0 && /^#[^\s\.,]+/.test(text)))) return null;
	const isHead = text.startsWith('#');
	const hashtag = text.match(/^\s?#[^\s\.,]+/)[0];
	const res: any[] = !isHead ? [{
		type: 'text',
		content: text[0]
	}] : [];
	res.push({
		type: 'hashtag',
		content: isHead ? hashtag : hashtag.substr(1),
		hashtag: isHead ? hashtag.substr(1) : hashtag.substr(2)
	});
	return res as TextElementHashtag[];
}
