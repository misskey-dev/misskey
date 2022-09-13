import { promisify } from 'node:util';
import * as crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserProfiles, AttestationChallenges } from '@/models/index.js';
import type { IdService } from '@/services/IdService.js';
import { hash } from '../../../2fa.js';

const randomBytes = promisify(crypto.randomBytes);

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await UserProfiles.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			if (!profile.twoFactorEnabled) {
				throw new Error('2fa not enabled');
			}

			// 32 byte challenge
			const entropy = await randomBytes(32);
			const challenge = entropy.toString('base64')
				.replace(/=/g, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_');

			const challengeId = this.idService.genId();

			await AttestationChallenges.insert({
				userId: me.id,
				id: challengeId,
				challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
				createdAt: new Date(),
				registrationChallenge: true,
			});

			return {
				challengeId,
				challenge,
			};
		});
	}
}
