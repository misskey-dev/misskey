/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiNote } from './Note.js';
import { MiClip } from './Clip.js';

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

	@ManyToOne(type => MiNote, {
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

	@ManyToOne(type => MiClip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: MiClip | null;
}
