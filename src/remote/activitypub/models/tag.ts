import { toArray } from '../../../prelude/array';
import { IObject, isHashtag, IApHashtag } from '../type';

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
