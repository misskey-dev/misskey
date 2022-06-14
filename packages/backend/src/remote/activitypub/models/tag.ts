import { toArray } from '@/prelude/array.js';
import { IObject, isHashtag, IApHashtag, isLink, ILink } from '../type.js';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined) {
	if (tags == null) return [];

	const hashtags = extractApHashtagObjects(tags);

	return hashtags.map(tag => {
		const m = tag.name.match(/^#(.+)/);
		return m ? m[1] : null;
	}).filter((x): x is string => x != null);
}

export function extractApHashtagObjects(tags: IObject | IObject[] | null | undefined): IApHashtag[] {
	if (tags == null) return [];
	return toArray(tags).filter(isHashtag);
}

export function extractQuoteUrl(tags: IObject | IObject[] | null | undefined): string | null {
	if (tags == null) return null;
	const quotes: ILink[] = toArray(tags)
		.filter(isLink)
		.filter((link) => toArray(tag.rel).includes('https://misskey-hub.net/ns#_misskey_quote'));

	if (quotes.length === 1) {
		return quotes.href;
	} else {
		// either multiple quotes (unsupported) or no quote
		return null;
	}
}
