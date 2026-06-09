/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_poll')
export class MiUserPoll {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public createdById: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public createdBy: MiUser | null;

	@Column('varchar', {
		length: 1024, nullable: false,
	})
	public question: string;

	@Column('jsonb', {
		nullable: false,
		default: [],
	})
	public choices: string[];

	@Column('boolean', {
		default: false,
	})
	public isAnonymous: boolean;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public deadline: Date | null;

	@Index()
	@Column('boolean', {
		default: true,
	})
	public isActive: boolean;

	constructor(data: Partial<MiUserPoll>) {
		if (data == null) return;
		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
