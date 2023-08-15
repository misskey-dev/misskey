/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, ManyToOne, Index } from 'typeorm';
import { id } from '../id.js';
import { MiUser } from './User.js';

@Entity('attestation_challenge')
export class MiAttestationChallenge {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column('varchar', {
		length: 64,
		comment: 'Hex-encoded sha256 hash of the challenge.',
	})
	public challenge: string;

	@Column('timestamp with time zone', {
		comment: 'The date challenge was created for expiry purposes.',
	})
	public createdAt: Date;

	@Column('boolean', {
		comment:
			'Indicates that the challenge is only for registration purposes if true to prevent the challenge for being used as authentication.',
		default: false,
	})
	public registrationChallenge: boolean;

	constructor(data: Partial<MiAttestationChallenge>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
