/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';

/**
 * メッセージカードデザインの種類
 */
export const noqCardDesigns = [
	'default',
	'blue_sky',
	'love',
	'nocturne',
	'romantic',
	'sakura',
	'night_sky',
	'pastel',
] as const;

export type NoqCardDesign = typeof noqCardDesigns[number];

/**
 * 質問ステータスの種類
 */
export const noqQuestionStatuses = [
	'pending',
	'answered',
	'deleted',
] as const;

export type NoqQuestionStatus = typeof noqQuestionStatuses[number];

/**
 * Noqestion 質問エンティティ
 * - 質問者から回答者への匿名質問
 * - 回答ステータス管理
 * - メッセージカードデザイン選択
 * - E2E暗号化対応
 */
@Entity('noq_question')
@Index(['recipientId', 'status'])
@Index(['senderId'])
@Index(['createdAt'])
export class NoqQuestion {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * 質問者ID
	 * - nullable: ユーザー削除時にSET NULLで対応
	 * - 匿名質問のため、削除されてもデータは保持
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: '質問者ID（ユーザー削除時はNULL）',
	})
	public senderId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public sender: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: '回答者ID',
	})
	public recipientId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public recipient: MiUser | null;

	@Column('text', {
		comment: '質問本文（平文または暗号化）',
	})
	public text: string;

	@Column('varchar', {
		length: 512,
		nullable: true,
		comment: '添付画像URL',
	})
	public imageUrl: string | null;

	@Column('boolean', {
		default: false,
		comment: 'username開示フラグ',
	})
	public isUsernameDisclosed: boolean;

	@Column('boolean', {
		default: false,
		comment: '回答不要フラグ',
	})
	public isNoReplyRequested: boolean;

	@Column('varchar', {
		length: 32,
		default: 'default',
		comment: 'メッセージカードデザイン',
	})
	public cardDesign: NoqCardDesign;

	@Column('varchar', {
		length: 16,
		default: 'pending',
		comment: '回答ステータス (pending/answered/deleted)',
	})
	public status: NoqQuestionStatus;

	@Column('boolean', {
		default: false,
		comment: '通報済みフラグ',
	})
	public isReported: boolean;

	@Column('boolean', {
		default: false,
		comment: 'モデレーターによる開示済みフラグ',
	})
	public isDisclosedByMod: boolean;

	@Column('boolean', {
		default: false,
		comment: 'E2E暗号化フラグ',
	})
	public isE2EEncrypted: boolean;

	@Column('text', {
		nullable: true,
		comment: '暗号化された回答文',
	})
	public encryptedAnswer: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: '回答ノートID',
	})
	public answerNoteId: MiNote['id'] | null;

	@ManyToOne(type => MiNote, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public answerNote: MiNote | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: '作成日時',
	})
	public createdAt: Date;

	constructor(data: Partial<NoqQuestion>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
