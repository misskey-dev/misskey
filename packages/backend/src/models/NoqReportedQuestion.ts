/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { NoqQuestion } from './NoqQuestion.js';
import { MiAbuseUserReport } from './AbuseUserReport.js';

/**
 * Noqestion 通報質問中間テーブル
 * - Misskey標準の通報機能（AbuseUserReport）と質問を紐付ける
 * - 通報の詳細（通報者、理由、日時）はAbuseUserReportテーブルで管理
 */
@Entity('noq_reported_question')
@Index(['questionId', 'reportId'], { unique: true })
export class NoqReportedQuestion {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: '対象質問ID',
	})
	public questionId: NoqQuestion['id'];

	@ManyToOne(type => NoqQuestion, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public question: NoqQuestion | null;

	@Index()
	@Column({
		...id(),
		comment: 'Misskey通報ID',
	})
	public reportId: MiAbuseUserReport['id'];

	@ManyToOne(type => MiAbuseUserReport, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public report: MiAbuseUserReport | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: '作成日時',
	})
	public createdAt: Date;

	constructor(data: Partial<NoqReportedQuestion>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
