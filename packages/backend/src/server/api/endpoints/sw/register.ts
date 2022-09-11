import { Inject, Injectable } from '@nestjs/common';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { genId } from '@/misc/gen-id.js';
import { SwSubscriptions } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	description: 'Register to receive push notifications.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			state: {
				type: 'string',
				optional: true, nullable: false,
				enum: ['already-subscribed', 'subscribed'],
			},
			key: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
		auth: { type: 'string' },
		publickey: { type: 'string' },
	},
	required: ['endpoint', 'auth', 'publickey'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			// if already subscribed
			const exist = await SwSubscriptions.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			const instance = await fetchMeta(true);

			if (exist != null) {
				return {
					state: 'already-subscribed' as const,
					key: instance.swPublicKey,
				};
			}

			await SwSubscriptions.insert({
				id: genId(),
				createdAt: new Date(),
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			return {
				state: 'subscribed' as const,
				key: instance.swPublicKey,
			};
		});
	}
}
