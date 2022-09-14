import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Users } from '@/models/index.js';
import { UserProfiles, UserSecurityKeys } from '@/models/index.js';
import { publishMainStream } from '@/services/stream.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		credentialId: { type: 'string' },
	},
	required: ['password', 'credentialId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await UserProfiles.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			// Make sure we only delete the user's own creds
			await UserSecurityKeys.delete({
				userId: me.id,
				id: ps.credentialId,
			});

			// Publish meUpdated event
			publishMainStream(me.id, 'meUpdated', await this.usersRepository.pack(me.id, me, {
				detail: true,
				includeSecrets: true,
			}));

			return {};
		});
	}
}
