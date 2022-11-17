import { query } from '@/scripts/url';
import { url } from '@/config';

export function getProxiedImageUrl(imageUrl: string): string {
	return `${url}/proxy/image.webp?${query({
		url: imageUrl,
	})}`;
}

export function getProxiedImageUrlNullable(imageUrl: string | null | undefined): string | null {
	if (imageUrl == null) return null;
	return getProxiedImageUrl(imageUrl);
}
