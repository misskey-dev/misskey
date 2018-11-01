export type IMastodonEmoji = {
	shortcode: string,
	url: string,
	static_url: string,
	visible_in_picker: boolean
};

export async function toMastodonEmojis(emoji: any): Promise<IMastodonEmoji[]> {
	return [{
		shortcode: emoji.name,
		url: emoji.url,
		static_url: emoji.url, // TODO: Implement ensuring static emoji
		visible_in_picker: true
	}, ...(emoji.aliases as string[] || []).map(x => ({
		shortcode: x,
		url: emoji.url,
		static_url: emoji.url,
		visible_in_picker: true
	}))];
}

export function toMisskeyEmojiSync(emoji: IMastodonEmoji) {
	return {
		name: emoji.shortcode,
		url: emoji.url
	};
}

export function toMisskeyEmojiWithAliasesSync(emoji: IMastodonEmoji, ...aliases: string[]) {
	return {
		name: emoji.shortcode,
		aliases,
		url: emoji.url
	};
}
