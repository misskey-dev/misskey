import * as misskey from 'misskey-js';
import { url as instanceUrl } from '@/config';
import { defaultStore } from "@/store";

export function getAvatarUrl(user: misskey.entities.User) {
	if (user.avatarUrl && user.avatarUrl.startsWith(`${instanceUrl}/identicon`)) return user.avatarUrl;

	const builder = new URL(`${instanceUrl}/avatar.webp`);
	if (defaultStore.state.disableShowingAnimatedImages) builder.searchParams.set('static', '1');
	if (user.avatarUrl) builder.searchParams.set('url', user.avatarUrl);
	builder.searchParams.set('userId', user.id);

	return builder.toString();
}
