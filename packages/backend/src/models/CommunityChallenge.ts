/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('community_challenge')
export class MiCommunityChallenge {
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
		length: 256, nullable: false,
	})
	public title: string;

	@Column('varchar', {
		length: 2048, nullable: true,
	})
	public description: string | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: false,
	})
	public hashtag: string;

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

	constructor(data: Partial<MiCommunityChallenge>) {
		if (data == null) return;
		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
