/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_keypair')
export class MiUserKeypair {
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@OneToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 4096,
	})
	public publicKey: string;

	@Column('varchar', {
		length: 4096,
	})
	public privateKey: string;

	constructor(data: Partial<MiUserKeypair>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
