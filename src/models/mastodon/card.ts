import { INote } from "../note";
import parse from "../../mfm/parse";
import { TextElementLink } from "../../mfm/parse/elements/link";
import { getSummary } from "../../server/web/url-preview";

export type IMastodonCard = {
	url: string,
	title: string,
	description: string,
	image?: string,
	type: 'link' | 'photo' | 'video' | 'rich',
	author_name?: string,
	author_url?: string,
	provider_name?: string,
	provider_url?: string,
	html?: string,
	width?: number,
	height?: number
};

export async function toMastodonCard(note: INote): Promise<IMastodonCard> {
	const link = parse(note.text).find(x => x.type === 'link') as TextElementLink;
	if (link) {
		const summary = await getSummary(link.url);

		if (summary) {
			const { url, title, description, thumbnail, player } = summary;
			const src = player ? player.url : null;
			const { width, height } = player ? player : { width: 0, height: 0 };

			return {
				url,
				title,
				description,
				image: thumbnail,
				type: player ?
					'video' : thumbnail ?
					'photo' : 'link',
				author_name: null, // TODO: うちら開発者やぞ！
				author_url: null, // TODO: Misskeyだぞ！
				provider_name: null, // TODO: いいのか！いいのか！
				provider_url: null, // TODO: そんなこと（実装）でいいのか！
				html: player ? `<iframe src="${src}" width="${width}" height="${height}" allowtransparency="true" scrolling="no" frameborder="0"></iframe>` : null,
				width,
				height
			};
		}
	}

	return null;
}
