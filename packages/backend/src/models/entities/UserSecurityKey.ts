/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, ManyToOne, Index } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class UserSecurityKey {
	@PrimaryColumn('varchar', {
		comment: 'Variable-length id given to navigator.credentials.get()',
	})
	public id: string;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

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
	public credentialDeviceType?: string;

	@Column('boolean', {
		comment: 'Whether or not the credential has been backed up',
		nullable: true,
	})
	public credentialBackedUp?: boolean;

	@Column('varchar', {
		comment: 'The type of the credential returned by the browser',
		length: 32, array: true, nullable: true,
	})
	public transports?: string[];

	constructor(data: Partial<UserSecurityKey>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
