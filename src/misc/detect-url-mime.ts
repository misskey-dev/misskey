import { getUrl } from './download-url';
import { detectType } from './get-file-info';

export async function detectUrlMime(url: string) {
	const { mime } = await detectType(getUrl(url));
	return mime;
}
