/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiClip } from './Clip.js';
import { MiNote } from './Note.js';
import { id } from './util/id.js';

@Entity('clip_note')
@Index(['noteId', 'clipId'], { unique: true })
export class MiClipNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The note ID.',
	})
	public noteId: MiNote['id'];

	@ManyToOne(() => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	@Index()
	@Column({
		...id(),
		comment: 'The clip ID.',
	})
	public clipId: MiClip['id'];

	@ManyToOne(() => MiClip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: MiClip | null;
}
