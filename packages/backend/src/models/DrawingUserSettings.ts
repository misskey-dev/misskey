/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('drawing_user_settings')
@Index(['userId', 'canvasId'], { unique: true })
export class MiDrawingUserSettings {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('varchar', {
		length: 32,
		comment: 'The user ID.',
	})
	public userId: string;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column('varchar', {
		length: 128,
		comment: 'Canvas ID (roomId or user-userId1-userId2)',
	})
	public canvasId: string;

	@Column('varchar', {
		length: 32,
		default: 'pen',
		comment: 'Current tool (pen, eraser, eyedropper)',
	})
	public currentTool: string;

	@Column('varchar', {
		length: 7,
		default: '#000000',
		comment: 'Current color (hex)',
	})
	public currentColor: string;

	@Column('float', {
		default: 1.0,
		comment: 'Current opacity (0.1-1.0)',
	})
	public currentOpacity: number;

	@Column('integer', {
		default: 2,
		comment: 'Current stroke width',
	})
	public strokeWidth: number;

	@Column('integer', {
		default: 0,
		comment: 'Current layer (0-2)',
	})
	public currentLayer: number;

	@Column('jsonb', {
		default: [true, true, true],
		comment: 'Layer visibility settings',
	})
	public layerVisible: boolean[];

	@Column('jsonb', {
		default: [1, 1, 1],
		comment: 'Layer opacity settings',
	})
	public layerOpacity: number[];

	@Column('float', {
		default: 1.0,
		comment: 'Zoom level (0.5-10.0)',
	})
	public zoomLevel: number;

	@Column('float', {
		default: 0,
		comment: 'Pan offset X',
	})
	public panOffsetX: number;

	@Column('float', {
		default: 0,
		comment: 'Pan offset Y',
	})
	public panOffsetY: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Custom color palette (array of 16 hex colors)',
	})
	public colors: string[] | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public updatedAt: Date;
}
