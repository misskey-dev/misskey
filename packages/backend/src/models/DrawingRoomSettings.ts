/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';

@Entity('drawing_room_settings')
export class MiDrawingRoomSettings {
	@PrimaryColumn(id())
	public id: string;

	@Column('integer', {
		default: 800,
		comment: 'Canvas width in pixels',
	})
	public canvasWidth: number;

	@Column('integer', {
		default: 600,
		comment: 'Canvas height in pixels',
	})
	public canvasHeight: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public updatedAt: Date;
}
