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
import { DriveFiles, UserServiceLinkings, UserKeypairs } from '../../../models';

export async function renderPerson(user: ILocalUser) {
	const id = `${config.url}/users/${user.id}`;

	const [avatar, banner, links] = await Promise.all([
		DriveFiles.findOne(user.avatarId),
		DriveFiles.findOne(user.bannerId),
		UserServiceLinkings.findOne({ userId: user.id })
	]);

	const attachment: {
		type: string,
		name: string,
		value: string,
		verified_at?: string,
		identifier?: IIdentifier
	}[] = [];

	if (links.twitter) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Twitter',
			value: `<a href="https://twitter.com/intent/user?user_id=${links.twitterUserId}" rel="me nofollow noopener" target="_blank"><span>@${links.twitterScreenName}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:twitter',
				value: `${links.twitterUserId}@${links.twitterScreenName}`
			}
		});
	}

	if (links.github) {
		attachment.push({
			type: 'PropertyValue',
			name: 'GitHub',
			value: `<a href="https://github.com/${links.githubLogin}" rel="me nofollow noopener" target="_blank"><span>@${links.githubLogin}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:github',
				value: `${links.githubId}@${links.githubLogin}`
			}
		});
	}

	if (links.discord) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Discord',
			value: `<a href="https://discordapp.com/users/${links.discordId}" rel="me nofollow noopener" target="_blank"><span>${links.discordUsername}#${links.discordDiscriminator}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:discord',
				value: `${links.discordId}@${links.discordUsername}#${links.discordDiscriminator}`
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

	const keypair = await UserKeypairs.findOne({
		userId: user.id
	});

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
		publicKey: renderKey(user, keypair),
		isCat: user.isCat,
		attachment: attachment.length ? attachment : undefined
	};
}
