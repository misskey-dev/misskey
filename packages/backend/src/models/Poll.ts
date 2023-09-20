/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { noteVisibilities } from '@/types.js';
import { id } from './util/id.js';
import { MiNote } from './Note.js';
import type { MiUser } from './User.js';

@Entity('poll')
export class MiPoll {
	@PrimaryColumn(id())
	public noteId: MiNote['id'];

	@OneToOne(type => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;

	@Column('boolean')
	public multiple: boolean;

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public choices: string[];

	@Column('integer', {
		array: true,
	})
	public votes: number[];

	//#region Denormalized fields
	@Column('enum', {
		enum: noteVisibilities,
		comment: '[Denormalized]',
	})
	public noteVisibility: typeof noteVisibilities[number];

	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public userId: MiUser['id'];

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public userHost: string | null;
	//#endregion

	constructor(data: Partial<MiPoll>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type IPoll = {
	choices: string[];
	votes?: number[];
	multiple: boolean;
	expiresAt: Date | null;
};
