import { url as instanceUrl } from '../../config';
import * as url from '../../../../prelude/url';

export function getStaticImageUrl(baseUrl: string): string {
	const u = new URL(baseUrl);
	return `https://images.weserv.nl/${url.query({
		url: u.href
	})}`;
}
