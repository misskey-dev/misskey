import renderImage from './image';
import renderKey from './key';
import config from '../../../config';
import { ILocalUser } from '../../../models/entities/user';
import { toHtml } from '../../../mfm/to-html';
import { parse } from '../../../mfm/parse';
import { getEmojis } from './note';
import renderEmoji from './emoji';
import { IIdentifier } from '../models/identifier';
import renderHashtag from './hashtag';
import { DriveFiles, UserProfiles, UserKeypairs } from '../../../models';
import { ensure } from '../../../prelude/ensure';

export async function renderPerson(user: ILocalUser) {
	const id = `${config.url}/users/${user.id}`;
	const isSystem = !!user.username.match(/\./);

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

	const emojis = await getEmojis(user.emojis);
	const apemojis = emojis.map(emoji => renderEmoji(emoji));

	const hashtagTags = (user.tags || []).map(tag => renderHashtag(tag));

	const tag = [
		...apemojis,
		...hashtagTags,
	];

	const keypair = await UserKeypairs.findOne(user.id).then(ensure);

	const person = {
		type: isSystem ? 'Application' : user.isBot ? 'Service' : 'Person',
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
		discoverable: !!user.isExplorable,
		publicKey: renderKey(user, keypair, `#main-key`),
		isCat: user.isCat,
		attachment: attachment.length ? attachment : undefined
	} as any;

	if (profile?.birthday) {
		person['vcard:bday'] = profile.birthday;
	}

	if (profile?.location) {
		person['vcard:Address'] = profile.location;
	}

	return person;
}
