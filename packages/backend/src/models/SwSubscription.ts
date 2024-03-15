/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('sw_subscription')
export class MiSwSubscription {
	@PrimaryColumn(id())
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
		length: 512,
	})
	public endpoint: string;

	@Column('varchar', {
		length: 256,
	})
	public auth: string;

	@Column('varchar', {
		length: 128,
	})
	public publickey: string;

	@Column('boolean', {
		default: false,
	})
	public sendReadMessage: boolean;
}
