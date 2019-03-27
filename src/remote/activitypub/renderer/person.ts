import renderImage from './image';
import renderKey from './key';
import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';
import { toHtml } from '../../../mfm/toHtml';
import { parse } from '../../../mfm/parse';
import { getEmojis } from './note';
import renderEmoji from './emoji';
import { IIdentifier } from '../models/identifier';
import renderHashtag from './hashtag';
import { DriveFiles } from '../../../models';

export async function renderPerson(user: ILocalUser) {
	const id = `${config.url}/users/${user.id}`;

	const [avatar, banner] = await Promise.all([
		DriveFiles.findOne(user.avatarId),
		DriveFiles.findOne(user.bannerId)
	]);

	const attachment: {
		type: string,
		name: string,
		value: string,
		verified_at?: string,
		identifier?: IIdentifier
	}[] = [];

	if (user.services.twitter) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Twitter',
			value: `<a href="https://twitter.com/intent/user?user_id=${user.services.twitter.userId}" rel="me nofollow noopener" target="_blank"><span>@${user.services.twitter.screenName}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:twitter',
				value: `${user.services.twitter.userId}@${user.services.twitter.screenName}`
			}
		});
	}

	if (user.services.github) {
		attachment.push({
			type: 'PropertyValue',
			name: 'GitHub',
			value: `<a href="https://github.com/${user.services.github.login}" rel="me nofollow noopener" target="_blank"><span>@${user.services.github.login}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:github',
				value: `${user.services.github.id}@${user.services.github.login}`
			}
		});
	}

	if (user.services.discord) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Discord',
			value: `<a href="https://discordapp.com/users/${user.services.discord.id}" rel="me nofollow noopener" target="_blank"><span>${user.services.discord.username}#${user.services.discord.discriminator}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:discord',
				value: `${user.services.discord.id}@${user.services.discord.username}#${user.services.discord.discriminator}`
			}
		});
	}

	const emojis = await getEmojis(user.emojis);
	const apemojis = emojis.map(emoji => renderEmoji(emoji));

	const hashtagTags = (user.tags || []).map(tag => renderHashtag(tag));

	const tag = [
		...apemojis,
		...hashtagTags,
	];

	return {
		type: user.isBot ? 'Service' : 'Person',
		id,
		inbox: `${id}/inbox`,
		outbox: `${id}/outbox`,
		followers: `${id}/followers`,
		following: `${id}/following`,
		featured: `${id}/collections/featured`,
		sharedInbox: `${config.url}/inbox`,
		endpoints: { sharedInbox: `${config.url}/inbox` },
		url: `${config.url}/@${user.username}`,
		preferredUsername: user.username,
		name: user.name,
		summary: toHtml(parse(user.description)),
		icon: user.avatarId && renderImage(avatar),
		image: user.bannerId && renderImage(banner),
		tag,
		manuallyApprovesFollowers: user.isLocked,
		publicKey: renderKey(user),
		isCat: user.isCat,
		attachment: attachment.length ? attachment : undefined
	};
}
