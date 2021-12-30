import { IObject } from '../type';
import { extractApHashtagObjects } from '../models/tag';
import { fromHtml } from '../../../mfm/from-html';

export function htmlToMfm(html: string, tag?: IObject | IObject[]) {
	const hashtagNames = extractApHashtagObjects(tag).map(x => x.name).filter((x): x is string => x != null);

	return fromHtml(html, hashtagNames);
}
