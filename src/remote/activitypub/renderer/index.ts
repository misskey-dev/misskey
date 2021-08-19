import config from '@/config/index';
import { v4 as uuid } from 'uuid';
import { IActivity } from '../type';
import { LdSignature } from '../misc/ld-signature';
import { getUserKeypair } from '@/misc/keypair-store';
import { User } from '@/models/entities/user';

export const renderActivity = (x: any): IActivity | null => {
	if (x == null) return null;

	if (x !== null && typeof x === 'object' && x.id == null) {
		x.id = `${config.url}/${uuid()}`;
	}

	return Object.assign({
		'@context': [
			'https://www.w3.org/ns/activitystreams',
			'https://w3id.org/security/v1',
			{
				// as non-standards
				manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
				sensitive: 'as:sensitive',
				Hashtag: 'as:Hashtag',
				quoteUrl: 'as:quoteUrl',
				// Mastodon
				toot: 'http://joinmastodon.org/ns#',
				Emoji: 'toot:Emoji',
				featured: 'toot:featured',
				discoverable: 'toot:discoverable',
				// schema
				schema: 'http://schema.org#',
				PropertyValue: 'schema:PropertyValue',
				value: 'schema:value',
				// Misskey
				misskey: `${config.url}/ns#`,
				'_misskey_content': 'misskey:_misskey_content',
				'_misskey_quote': 'misskey:_misskey_quote',
				'_misskey_reaction': 'misskey:_misskey_reaction',
				'_misskey_votes': 'misskey:_misskey_votes',
				'_misskey_talk': 'misskey:_misskey_talk',
				'isCat': 'misskey:isCat',
				// vcard
				vcard: 'http://www.w3.org/2006/vcard/ns#',
			}
		]
	}, x);
};

export const attachLdSignature = async (activity: any, user: { id: User['id']; host: null; }): Promise<IActivity | null> => {
	if (activity == null) return null;

	const keypair = await getUserKeypair(user.id);

	const ldSignature = new LdSignature();
	ldSignature.debug = false;
	activity = await ldSignature.signRsaSignature2017(activity, keypair.privateKey, `${config.url}/users/${user.id}#main-key`);

	return activity;
};
