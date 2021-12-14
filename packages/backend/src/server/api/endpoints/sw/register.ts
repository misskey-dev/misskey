import $ from 'cafy';
import define from '../../define';
import { fetchMeta } from '@/misc/fetch-meta';
import { genId } from '@/misc/gen-id';
import { SwSubscriptions } from '@/models/index';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	params: {
		endpoint: {
			validator: $.str,
		},

		auth: {
			validator: $.str,
		},

		publickey: {
			validator: $.str,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			state: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				enum: ['already-subscribed', 'subscribed'],
			},
			key: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	// if already subscribed
	const exist = await SwSubscriptions.findOne({
		userId: user.id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey,
	});

	const instance = await fetchMeta(true);

	if (exist != null) {
		return {
			state: 'already-subscribed',
			key: instance.swPublicKey,
		};
	}

	await SwSubscriptions.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		endpoint: ps.endpoint,
		auth: ps.auth,
		publickey: ps.publickey,
	});

	return {
		state: 'subscribed',
		key: instance.swPublicKey,
	};
});
