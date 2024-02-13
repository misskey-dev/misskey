/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, ManyToOne, Index } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_security_key')
export class MiUserSecurityKey {
	@PrimaryColumn('varchar', {
		comment: 'Variable-length id given to navigator.credentials.get()',
	})
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		comment: 'User-defined name for this key',
		length: 30,
	})
	public name: string;

	@Index()
	@Column('varchar', {
		comment: 'The public key of the UserSecurityKey, hex-encoded.',
	})
	public publicKey: string;

	@Column('bigint', {
		comment: 'The number of times the UserSecurityKey was validated.',
		default: 0,
	})
	public counter: number;

	@Column('timestamp with time zone', {
		comment: 'Timestamp of the last time the UserSecurityKey was used.',
		default: () => 'now()',
	})
	public lastUsed: Date;

	@Column('varchar', {
		comment: 'The type of Backup Eligibility in authenticator data',
		length: 32, nullable: true,
	})
	public credentialDeviceType: string | null;

	@Column('boolean', {
		comment: 'Whether or not the credential has been backed up',
		nullable: true,
	})
	public credentialBackedUp: boolean | null;

	@Column('varchar', {
		comment: 'The type of the credential returned by the browser',
		length: 32, array: true, nullable: true,
	})
	public transports: string[] | null;

	constructor(data: Partial<MiUserSecurityKey>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
