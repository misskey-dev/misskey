/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
import cbor from 'cbor';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { TwoFactorAuthenticationService } from '@/core/TwoFactorAuthenticationService.js';
import type { AttestationChallengesRepository, UserProfilesRepository, UserSecurityKeysRepository } from '@/models/index.js';

const cborDecodeFirst = promisify(cbor.decodeFirst) as any;

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clientDataJSON: { type: 'string' },
		attestationObject: { type: 'string' },
		password: { type: 'string' },
		challengeId: { type: 'string' },
		name: { type: 'string', minLength: 1, maxLength: 30 },
	},
	required: ['clientDataJSON', 'attestationObject', 'password', 'challengeId', 'name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.attestationChallengesRepository)
		private attestationChallengesRepository: AttestationChallengesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private twoFactorAuthenticationService: TwoFactorAuthenticationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const rpIdHashReal = this.twoFactorAuthenticationService.hash(Buffer.from(this.config.hostname, 'utf-8'));

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			if (!profile.twoFactorEnabled) {
				throw new Error('2fa not enabled');
			}

			const clientData = JSON.parse(ps.clientDataJSON);

			if (clientData.type !== 'webauthn.create') {
				throw new Error('not a creation attestation');
			}
			if (clientData.origin !== this.config.scheme + '://' + this.config.host) {
				throw new Error('origin mismatch');
			}

			const clientDataJSONHash = this.twoFactorAuthenticationService.hash(Buffer.from(ps.clientDataJSON, 'utf-8'));

			const attestation = await cborDecodeFirst(ps.attestationObject);

			const rpIdHash = attestation.authData.slice(0, 32);
			if (!rpIdHashReal.equals(rpIdHash)) {
				throw new Error('rpIdHash mismatch');
			}

			const flags = attestation.authData[32];

			// eslint:disable-next-line:no-bitwise
			if (!(flags & 1)) {
				throw new Error('user not present');
			}

			const authData = Buffer.from(attestation.authData);
			const credentialIdLength = authData.readUInt16BE(53);
			const credentialId = authData.slice(55, 55 + credentialIdLength);
			const publicKeyData = authData.slice(55 + credentialIdLength);
			const publicKey: Map<number, any> = await cborDecodeFirst(publicKeyData);
			if (publicKey.get(3) !== -7) {
				throw new Error('alg mismatch');
			}

			const procedures = this.twoFactorAuthenticationService.getProcedures();

			if (!(procedures as any)[attestation.fmt]) {
				throw new Error(`unsupported fmt: ${attestation.fmt}. Supported ones: ${Object.keys(procedures)}`);
			}

			const verificationData = (procedures as any)[attestation.fmt].verify({
				attStmt: attestation.attStmt,
				authenticatorData: authData,
				clientDataHash: clientDataJSONHash,
				credentialId,
				publicKey,
				rpIdHash,
			});
			if (!verificationData.valid) throw new Error('signature invalid');

			const attestationChallenge = await this.attestationChallengesRepository.findOneBy({
				userId: me.id,
				id: ps.challengeId,
				registrationChallenge: true,
				challenge: this.twoFactorAuthenticationService.hash(clientData.challenge).toString('hex'),
			});

			if (!attestationChallenge) {
				throw new Error('non-existent challenge');
			}

			await this.attestationChallengesRepository.delete({
				userId: me.id,
				id: ps.challengeId,
			});

			// Expired challenge (> 5min old)
			if (
				new Date().getTime() - attestationChallenge.createdAt.getTime() >=
		5 * 60 * 1000
			) {
				throw new Error('expired challenge');
			}

			const credentialIdString = credentialId.toString('hex');

			await this.userSecurityKeysRepository.insert({
				userId: me.id,
				id: credentialIdString,
				lastUsed: new Date(),
				name: ps.name,
				publicKey: verificationData.publicKey.toString('hex'),
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				detail: true,
				includeSecrets: true,
			}));

			return {
				id: credentialIdString,
				name: ps.name,
			};
		});
	}
}
