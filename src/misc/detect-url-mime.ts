import { getUrl } from './download-url';
import { detectType } from './get-file-info';
import { readableRead } from './stream/read';

export async function detectUrlMime(url: string) {
	const { mime } = await detectType(readableRead(getUrl(url)));
	return mime;
}
