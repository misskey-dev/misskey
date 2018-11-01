import { IUser } from '../user';
import config from '../../config';
import { IMastodonEmoji } from './emoji';
import parse from '../../mfm/parse';
import toHtml from '../../mfm/html';

export type IMastodonAccount = {
	id: string,
	username: string,
	acct: string,
	display_name: string,
	locked: boolean,
	bot?: boolean,
	created_at: Date,
	note: string,
	url: string,
	avatar: string,
	avatar_static: string,
	header: string,
	header_static: string,
	followers_count: number,
	following_count: number,
	statuses_count: number,
	emojis: IMastodonEmoji[],
	moved?: IMastodonAccount,
	fields?: {
		name: string,
		value: string,
		verified_at?: Date
	}[]
};

export async function toMastodonAccount(user: IUser): Promise<IMastodonAccount> {
	const acct = user.host ? `${user.username}@${user.host}` : user.username;
	return {
		id: user._id.toHexString(),
		username: user.username,
		acct: acct,
		display_name: user.name || '',
		locked: user.isLocked,
		bot: user.isBot,
		created_at: user.createdAt,
		note: toHtml(parse(user.description)),
		url: `${config.url}/@${acct}`,
		avatar: user.avatarUrl || '',
		avatar_static: /*user.avatarUrl.endsWith('.gif') ? '' : user.avatarUrl, // TODO: Implement static avatar provider
		*/ null,
		header: user.bannerUrl || '',
		header_static: /*user.bannerUrl.endsWith('.gif') ? '' : user.bannerUrl, // TODO: Implement static header provider
		*/ null,
		followers_count: user.followersCount,
		following_count: user.followingCount,
		statuses_count: user.notesCount,
		emojis: [],
		moved: null,
		fields: null
	};
}
