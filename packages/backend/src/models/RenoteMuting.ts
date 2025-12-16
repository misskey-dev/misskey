/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('renote_muting')
@Index(['muterId', 'muteeId'], { unique: true })
export class MiRenoteMuting {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The mutee user ID.',
	})
	public muteeId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public mutee: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The muter user ID.',
	})
	public muterId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public muter: MiUser | null;
}
