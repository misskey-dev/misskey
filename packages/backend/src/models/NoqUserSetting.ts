/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

/**
 * Noqestion ユーザー設定エンティティ
 * - 質問箱の有効/無効
 * - username開示必須設定
 * - センシティブワード非表示設定
 * - 注意事項テキスト
 * - NGワードリスト
 * - E2E暗号化公開鍵
 */
@Entity('noq_user_setting')
export class NoqUserSetting {
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@OneToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('boolean', {
		default: false,
		comment: '質問箱ON/OFF',
	})
	public isEnabled: boolean;

	@Column('boolean', {
		default: false,
		comment: 'username開示必須フラグ',
	})
	public requireUsernameDisclosure: boolean;

	@Column('boolean', {
		default: false,
		comment: 'センシティブワード非表示フラグ',
	})
	public hideSensitiveQuestions: boolean;

	@Column('text', {
		nullable: true,
		comment: '質問前の注意事項（最大1000文字）',
	})
	public notice: string | null;

	@Column('varchar', {
		array: true,
		default: '{}',
		comment: '個人NGワードリスト',
	})
	public ngWordList: string[];

	/**
	 * E2E暗号化公開鍵
	 * - ECDH P-256 公開鍵（Base64 URL-safe エンコード、約87文字）
	 * - 暗号化時にこの公開鍵を使用して共有秘密を導出
	 */
	@Column('varchar', {
		length: 128,
		nullable: true,
		comment: 'E2E暗号化公開鍵（ECDH P-256、Base64 URL-safe）',
	})
	public e2ePublicKey: string | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: '作成日時',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: '更新日時',
	})
	public updatedAt: Date;

	constructor(data: Partial<NoqUserSetting>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
