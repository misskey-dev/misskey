import { toArray } from '../../../prelude/array';
import { IObject, isHashtag } from '../type';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined) {
	if (tags == null) return [];

	const hashtags = toArray(tags).filter(isHashtag);

	return hashtags.map(tag => {
		const m = tag.name.match(/^#(.+)/);
		return m ? m[1] : null;
	}).filter((x): x is string => x != null);
}
