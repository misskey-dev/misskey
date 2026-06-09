/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

export type EmojiProposalStatus = 'pending' | 'approved' | 'rejected';

@Entity('emoji_proposal')
export class MiEmojiProposal {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public proposedById: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public proposedBy: MiUser | null;

	@Column('varchar', {
		length: 64, nullable: false,
	})
	public name: string;

	@Column('varchar', {
		length: 512, nullable: false,
	})
	public imageUrl: string;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public category: string | null;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public description: string | null;

	@Index()
	@Column('varchar', {
		length: 32, nullable: false, default: 'pending',
	})
	public status: EmojiProposalStatus;

	@Column('integer', {
		default: 0,
	})
	public voteCount: number;

	constructor(data: Partial<MiEmojiProposal>) {
		if (data == null) return;
		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
