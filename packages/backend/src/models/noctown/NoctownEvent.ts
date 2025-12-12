/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { id } from '../util/id.js';

export const noctownEventTypes = [
	'seasonal',      // 季節イベント（春夏秋冬）
	'holiday',       // 祝日イベント
	'limited',       // 期間限定イベント
	'ranking',       // ランキングイベント
	'collection',    // 収集イベント
	'community',     // コミュニティイベント
] as const;

export type NoctownEventType = typeof noctownEventTypes[number];

@Entity('noctown_event')
@Index(['startDate'])
@Index(['endDate'])
@Index(['isActive'])
export class NoctownEvent {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'Event name',
	})
	public name: string;

	@Column('text', {
		nullable: true,
		comment: 'Event description',
	})
	public description: string | null;

	@Column('varchar', {
		length: 32,
		default: 'seasonal',
		comment: 'Event type',
	})
	public eventType: NoctownEventType;

	@Column('varchar', {
		length: 512,
		nullable: true,
		comment: 'Event banner image URL',
	})
	public bannerUrl: string | null;

	@Column('timestamp with time zone', {
		comment: 'Event start date',
	})
	public startDate: Date;

	@Column('timestamp with time zone', {
		comment: 'Event end date',
	})
	public endDate: Date;

	@Column('boolean', {
		default: true,
		comment: 'Is event active',
	})
	public isActive: boolean;

	@Column('integer', {
		default: 0,
		comment: 'Required points for completion',
	})
	public requiredPoints: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Event-specific configuration',
	})
	public config: Record<string, unknown> | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Event objectives/milestones',
	})
	public milestones: Array<{
		points: number;
		name: string;
		description: string | null;
		rewardId: string | null;
	}> | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
