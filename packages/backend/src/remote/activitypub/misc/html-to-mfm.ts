import { IObject } from '../type.js';
import { extractApHashtagObjects } from '../models/tag.js';
import { fromHtml } from '../../../mfm/from-html.js';

export function htmlToMfm(html: string, tag?: IObject | IObject[]) {
	const hashtagNames = extractApHashtagObjects(tag).map(x => x.name).filter((x): x is string => x != null);

	return fromHtml(html, hashtagNames);
}
