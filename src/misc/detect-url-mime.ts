import { getUrl } from './download-url';
import { detectType } from './get-file-info';
import { toBufferArray } from './stream/to-buffer-array';

export async function detectUrlMime(url: string) {
	const { mime } = await detectType(await toBufferArray(getUrl(url)));
	return mime;
}
