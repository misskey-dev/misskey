import { IObject } from '../type';
import { extractApMentionObjects } from '../models/mention';
import { extractApHashtagObjects } from '../models/tag';
import { fromHtml } from '../../../mfm/fromHtml';

export function htmlToMfm(html: string, tag?: IObject | IObject[]) {
	const mentionHrefs = extractApMentionObjects(tag).map(x => x.href).filter((x): x is string => x != null);
	const hashtagHrefs = extractApHashtagObjects(tag).map(x => x.href).filter((x): x is string => x != null);

	return fromHtml(html, mentionHrefs, hashtagHrefs);
}
