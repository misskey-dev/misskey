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
import { DriveFiles, UserProfiles, UserKeypairs } from '../../../models';
import { ensure } from '../../../prelude/ensure';

export async function renderPerson(user: ILocalUser) {
	const id = `${config.url}/users/${user.id}`;

	const [avatar, banner, profile] = await Promise.all([
		user.avatarId ? DriveFiles.findOne(user.avatarId) : Promise.resolve(undefined),
		user.bannerId ? DriveFiles.findOne(user.bannerId) : Promise.resolve(undefined),
		UserProfiles.findOne(user.id).then(ensure)
	]);

	const attachment: {
		type: 'PropertyValue',
		name: string,
		value: string,
		identifier?: IIdentifier
	}[] = [];

	if (profile.fields) {
		for (const field of profile.fields) {
			attachment.push({
				type: 'PropertyValue',
				name: field.name,
				value: (field.value != null && field.value.match(/^https?:/))
					? `<a href="${new URL(field.value).href}" rel="me nofollow noopener" target="_blank">${new URL(field.value).href}</a>`
					: field.value
			});
		}
	}

	if (profile.twitter) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Twitter',
			value: `<a href="https://twitter.com/intent/user?user_id=${profile.twitterUserId}" rel="me nofollow noopener" target="_blank"><span>@${profile.twitterScreenName}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:twitter',
				value: `${profile.twitterUserId}@${profile.twitterScreenName}`
			}
		});
	}

	if (profile.github) {
		attachment.push({
			type: 'PropertyValue',
			name: 'GitHub',
			value: `<a href="https://github.com/${profile.githubLogin}" rel="me nofollow noopener" target="_blank"><span>@${profile.githubLogin}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:github',
				value: `${profile.githubId}@${profile.githubLogin}`
			}
		});
	}

	if (profile.discord) {
		attachment.push({
			type: 'PropertyValue',
			name: 'Discord',
			value: `<a href="https://discordapp.com/users/${profile.discordId}" rel="me nofollow noopener" target="_blank"><span>${profile.discordUsername}#${profile.discordDiscriminator}</span></a>`,
			identifier: {
				type: 'PropertyValue',
				name: 'misskey:authentication:discord',
				value: `${profile.discordId}@${profile.discordUsername}#${profile.discordDiscriminator}`
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

	const keypair = await UserKeypairs.findOne(user.id).then(ensure);

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
		summary: toHtml(parse(profile.description)),
		icon: avatar ? renderImage(avatar) : null,
		image: banner ? renderImage(banner) : null,
		tag,
		manuallyApprovesFollowers: user.isLocked,
		publicKey: renderKey(user, keypair),
		isCat: user.isCat,
		attachment: attachment.length ? attachment : undefined
	};
}
