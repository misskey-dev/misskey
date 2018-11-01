import { IMastodonAccount } from './account';
import { IMastodonEmoji } from './emoji';
import { IMastodonAttachment } from './attachment';
import { IMastodonMention } from './mention';
import { IMastodonTag } from './tag';
import { IMastodonApplication } from './application';
import Note, { INote } from '../note';
import toHtml from '../../remote/activitypub/misc/get-note-html';

type IMastodonStatusVisibility = 'public' | 'unlisted' | 'private' | 'direct';

export interface IMastodonCommonStatus {
	id: string;
	created_at: Date;
	in_reply_to_id?: string;
	in_reply_to_account_id?: string;
	sensitive: boolean;
	spoiler_text: string;
	visibility: IMastodonStatusVisibility;
	language?: string;
	uri: string;
	content: string;
	url?: string;
	replies_count: number;
	reblogs_count: number;
	favourites_count: number;
	reblog: IMastodonStatus;
	application: IMastodonApplication;
	account: IMastodonAccount;
	media_attachments: IMastodonAttachment[];
	mentions: IMastodonMention[];
	tags: IMastodonTag[];
	emojis: IMastodonEmoji[];
}

export interface IMastodonPersonalStatus extends IMastodonCommonStatus {
	reblogged: boolean;
	favourited: boolean;
	muted: boolean;
	pinned: boolean;
}

export type IMastodonStatus = IMastodonCommonStatus | IMastodonPersonalStatus;

export async function toMastodonStatus(note: INote): Promise<IMastodonStatus> {
	let visibility: IMastodonStatusVisibility = 'direct';
	switch (note.visibility) {
		case 'public':
			visibility = 'public';
			break;
		case 'home':
			visibility = 'unlisted';
			break;
		case 'followers':
			visibility = 'private';
	}

	let reblog: IMastodonStatus;
	if (note._renote) {
		const renote = await Note.findOne({ ...note._renote, visibility: 'public' });
		if (renote)
			reblog = await toMastodonStatus(renote);
	}

	return {
		id: note._id.toHexString(),
		created_at: note.createdAt,
		in_reply_to_id: note.replyId.toHexString(),
		in_reply_to_account_id: note._reply && note._reply.userId ? note._reply.userId.toHexString() : null,
		sensitive: note._files ? note._files.some(x => x.metadata.isSensitive || false) : false,
		spoiler_text: note.cw,
		visibility,
		uri: note.uri,
		content: toHtml(note),
		url: note.uri,
		replies_count: note.repliesCount,
		reblogs_count: note.renoteCount,
		favourites_count: note.reactionCounts,
		reblog,
		application: null, // TODO: Implement Mastodon application
		media_attachments: null, // TODO: Implement Mastodon media attachment
		mentions: null, // TODO: Implement Mastodon mention
		emojis: [] // TODO: Implement Mastodon emoji
	} as IMastodonCommonStatus;
}
