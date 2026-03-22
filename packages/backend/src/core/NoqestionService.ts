/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { IdService } from '@/core/IdService.js';
import { bindThis } from '@/decorators.js';
import type {
	NoqUserSettingsRepository,
	NoqQuestionsRepository,
	NoqMutedUsersRepository,
	NoqReportedQuestionsRepository,
	UsersRepository,
	BlockingsRepository,
	MutingsRepository,
} from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { NoqUserSetting } from '@/models/NoqUserSetting.js';
import { NoqQuestion } from '@/models/NoqQuestion.js';
import type { NoqQuestionStatus, NoqCardDesign } from '@/models/NoqQuestion.js';
import { NoqMutedUser } from '@/models/NoqMutedUser.js';
import { QueryService } from '@/core/QueryService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { MetaService } from '@/core/MetaService.js';

/**
 * Noqestion - 匿名質問箱サービス
 *
 * ユーザー設定管理、質問送受信、回答機能を提供
 */
@Injectable()
export class NoqestionService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noqUserSettingsRepository)
		private noqUserSettingsRepository: NoqUserSettingsRepository,

		@Inject(DI.noqQuestionsRepository)
		private noqQuestionsRepository: NoqQuestionsRepository,

		@Inject(DI.noqMutedUsersRepository)
		private noqMutedUsersRepository: NoqMutedUsersRepository,

		@Inject(DI.noqReportedQuestionsRepository)
		private noqReportedQuestionsRepository: NoqReportedQuestionsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private idService: IdService,
		private queryService: QueryService,
		private notificationService: NotificationService,
		private noteCreateService: NoteCreateService,
		private metaService: MetaService,
	) {
	}

	// ========================================
	// ユーザー設定関連
	// ========================================

	/**
	 * ユーザー設定を取得または初期化
	 * - 設定が存在しなければデフォルト値で作成
	 */
	@bindThis
	public async getOrCreateUserSetting(userId: MiUser['id']): Promise<NoqUserSetting> {
		let setting = await this.noqUserSettingsRepository.findOneBy({ userId });

		if (setting == null) {
			setting = new NoqUserSetting({
				userId,
				isEnabled: false,
				requireUsernameDisclosure: false,
				hideSensitiveQuestions: false,
				notice: null,
				ngWordList: [],
				e2ePublicKey: null,
			});
			await this.noqUserSettingsRepository.insert(setting);
		}

		return setting;
	}

	/**
	 * ユーザー設定を更新
	 */
	@bindThis
	public async updateUserSetting(
		userId: MiUser['id'],
		params: Partial<Omit<NoqUserSetting, 'userId' | 'user' | 'createdAt' | 'updatedAt'>>,
	): Promise<NoqUserSetting> {
		// 設定が存在するか確認
		await this.getOrCreateUserSetting(userId);

		// 更新
		await this.noqUserSettingsRepository.update(
			{ userId },
			{
				...params,
				updatedAt: new Date(),
			},
		);

		return await this.noqUserSettingsRepository.findOneByOrFail({ userId });
	}

	/**
	 * 質問箱が有効かどうかを確認
	 */
	@bindThis
	public async isNoqestionEnabled(userId: MiUser['id']): Promise<boolean> {
		const setting = await this.noqUserSettingsRepository.findOneBy({ userId });
		return setting?.isEnabled ?? false;
	}

	// ========================================
	// 質問関連
	// ========================================

	/**
	 * 質問を送信
	 * - ブロック/ミュートチェック
	 * - NGワードチェック
	 * - 質問箱有効化チェック
	 */
	@bindThis
	public async sendQuestion(params: {
		senderId: MiUser['id'];
		recipientId: MiUser['id'];
		text: string;
		imageUrl?: string | null;
		isUsernameDisclosed?: boolean;
		isNoReplyRequested?: boolean;
		cardDesign?: NoqCardDesign;
	}): Promise<NoqQuestion> {
		const { senderId, recipientId, text, imageUrl, isUsernameDisclosed, isNoReplyRequested, cardDesign } = params;

		// 回答者の設定を取得
		const recipientSetting = await this.getOrCreateUserSetting(recipientId);

		// 質問箱が有効化されているかチェック
		if (!recipientSetting.isEnabled) {
			throw new Error('NOQESTION_DISABLED');
		}

		// username開示必須設定のチェック
		if (recipientSetting.requireUsernameDisclosure && !isUsernameDisclosed) {
			throw new Error('USERNAME_DISCLOSURE_REQUIRED');
		}

		// ブロックチェック（双方向）
		const isBlocked = await this.isBlocked(senderId, recipientId);
		if (isBlocked) {
			throw new Error('BLOCKED');
		}

		// ミュートチェック
		const isMuted = await this.isMuted(senderId, recipientId);
		if (isMuted) {
			throw new Error('MUTED');
		}

		// NGワードチェック
		const containsNgWord = this.containsNgWord(text, recipientSetting.ngWordList);
		if (containsNgWord) {
			throw new Error('CONTAINS_NG_WORD');
		}

		// 質問を作成
		const question = new NoqQuestion({
			id: this.idService.gen(),
			senderId,
			recipientId,
			text,
			imageUrl: imageUrl ?? null,
			isUsernameDisclosed: isUsernameDisclosed ?? false,
			isNoReplyRequested: isNoReplyRequested ?? false,
			cardDesign: cardDesign ?? 'default',
			status: 'pending' as NoqQuestionStatus,
			isReported: false,
			isDisclosedByMod: false,
			isE2EEncrypted: false,
			encryptedAnswer: null,
			answerNoteId: null,
		});

		await this.noqQuestionsRepository.insert(question);

		// 通知はボットからのDMで行う（noqQuestion通知は使用しない）
		// DM通知を送信（非同期で実行、エラーが発生しても質問送信は成功させる）
		this.sendDmNotification(recipientId, question.text).catch(err => {
			console.error('[Noqestion] DM notification failed:', err);
		});

		return question;
	}

	/**
	 * DM通知を送信
	 * - 質問箱用ボットアカウントから回答者へvisibility: specifiedのノートを送信
	 * - ボットアカウントが未設定の場合はスキップ
	 */
	@bindThis
	private async sendDmNotification(recipientId: MiUser['id'], questionText: string): Promise<void> {
		// Meta情報を取得
		const meta = await this.metaService.fetch(true);

		// ボットアカウントが未設定の場合はスキップ
		if (!meta.noqBotAccountId) {
			return;
		}

		// ボットアカウントと回答者の情報を取得
		const [botAccount, recipient] = await Promise.all([
			this.usersRepository.findOneBy({ id: meta.noqBotAccountId }),
			this.usersRepository.findOneBy({ id: recipientId }),
		]);

		// ボットアカウントまたは回答者が見つからない場合はスキップ
		if (!botAccount || !recipient) {
			return;
		}

		// 質問文を省略（100文字まで）
		const truncatedQuestion = questionText.length > 100
			? questionText.substring(0, 100) + '...'
			: questionText;

		// DM本文を作成
		const dmText = `Noquestionで質問されたにゃん！\n質問： ${truncatedQuestion}\nhttps://${this.config.host}/@${recipient.username}/noq`;

		try {
			// visibility: specifiedのノートを作成（DM相当）
			await this.noteCreateService.create(botAccount, {
				text: dmText,
				visibility: 'specified',
				visibleUsers: [{ id: recipient.id, host: recipient.host, uri: recipient.uri, username: recipient.username }],
			});
		} catch (err) {
			// DM送信に失敗してもエラーをログに記録するだけで処理を継続
			console.error('[Noqestion] Failed to send DM notification:', err);
		}
	}

	/**
	 * 質問を取得（受信者向け）
	 */
	@bindThis
	public async getReceivedQuestions(
		userId: MiUser['id'],
		options?: {
			status?: NoqQuestionStatus;
			limit?: number;
			sinceId?: string;
			untilId?: string;
		},
	): Promise<NoqQuestion[]> {
		const query = this.noqQuestionsRepository.createQueryBuilder('question')
			.where('question.recipientId = :userId', { userId });

		if (options?.status) {
			query.andWhere('question.status = :status', { status: options.status });
		}

		if (options?.sinceId) {
			query.andWhere('question.id > :sinceId', { sinceId: options.sinceId });
		}

		if (options?.untilId) {
			query.andWhere('question.id < :untilId', { untilId: options.untilId });
		}

		query.orderBy('question.createdAt', 'DESC');
		query.take(options?.limit ?? 20);

		return await query.getMany();
	}

	/**
	 * 質問を取得（送信者向け）
	 */
	@bindThis
	public async getSentQuestions(
		userId: MiUser['id'],
		options?: {
			limit?: number;
			sinceId?: string;
			untilId?: string;
		},
	): Promise<NoqQuestion[]> {
		const query = this.noqQuestionsRepository.createQueryBuilder('question')
			.where('question.senderId = :userId', { userId });

		if (options?.sinceId) {
			query.andWhere('question.id > :sinceId', { sinceId: options.sinceId });
		}

		if (options?.untilId) {
			query.andWhere('question.id < :untilId', { untilId: options.untilId });
		}

		query.orderBy('question.createdAt', 'DESC');
		query.take(options?.limit ?? 20);

		return await query.getMany();
	}

	/**
	 * 質問のステータスを更新
	 * - answerText: 回答テキストを直接保存（ノート削除時も保持するため）
	 */
	@bindThis
	public async updateQuestionStatus(
		questionId: NoqQuestion['id'],
		userId: MiUser['id'],
		status: NoqQuestionStatus,
		answerNoteId?: string | null,
		answerText?: string | null,
	): Promise<NoqQuestion> {
		const question = await this.noqQuestionsRepository.findOneBy({ id: questionId });

		if (question == null) {
			throw new Error('QUESTION_NOT_FOUND');
		}

		// 受信者のみ更新可能
		if (question.recipientId !== userId) {
			throw new Error('ACCESS_DENIED');
		}

		// 回答済みステータスの場合はansweredAtを更新
		const updateData: Partial<NoqQuestion> = {
			status,
			answerNoteId: answerNoteId ?? null,
			answerText: answerText ?? null,
		};
		if (status === 'answered') {
			updateData.answeredAt = new Date();
		}

		await this.noqQuestionsRepository.update(
			{ id: questionId },
			updateData,
		);

		// 回答済みステータスに変更された場合、質問者にDM通知を送信
		// senderId が null の場合（ユーザー削除済み）はスキップ
		if (status === 'answered' && answerNoteId && question.senderId) {
			this.sendAnswerDmNotification(question.senderId, answerNoteId).catch(err => {
				console.error('[Noqestion] Answer DM notification failed:', err);
			});
		}

		return await this.noqQuestionsRepository.findOneByOrFail({ id: questionId });
	}

	/**
	 * 回答DM通知を送信
	 * - 質問箱用ボットアカウントから質問者へvisibility: specifiedのノートを送信
	 * - ボットアカウントが未設定の場合はスキップ
	 */
	@bindThis
	private async sendAnswerDmNotification(senderId: MiUser['id'], noteId: string): Promise<void> {
		// Meta情報を取得
		const meta = await this.metaService.fetch(true);

		// ボットアカウントが未設定の場合はスキップ
		if (!meta.noqBotAccountId) {
			return;
		}

		// ボットアカウントと質問者の情報を取得
		const [botAccount, sender] = await Promise.all([
			this.usersRepository.findOneBy({ id: meta.noqBotAccountId }),
			this.usersRepository.findOneBy({ id: senderId }),
		]);

		// ボットアカウントまたは質問者が見つからない場合はスキップ
		if (!botAccount || !sender) {
			return;
		}

		// DM本文を作成
		const dmText = `質問に回答があったにゃん！\nhttps://${this.config.host}/notes/${noteId}`;

		try {
			// visibility: specifiedのノートを作成（DM相当）
			await this.noteCreateService.create(botAccount, {
				text: dmText,
				visibility: 'specified',
				visibleUsers: [{ id: sender.id, host: sender.host, uri: sender.uri, username: sender.username }],
			});
		} catch (err) {
			// DM送信に失敗してもエラーをログに記録するだけで処理を継続
			console.error('[Noqestion] Failed to send answer DM notification:', err);
		}
	}

	/**
	 * 暗号化回答でステータスを更新
	 * - E2E暗号化質問への回答用
	 */
	@bindThis
	public async updateQuestionStatusWithEncryptedAnswer(
		questionId: NoqQuestion['id'],
		userId: MiUser['id'],
		encryptedAnswer: string,
	): Promise<NoqQuestion> {
		const question = await this.noqQuestionsRepository.findOneBy({ id: questionId });

		if (question == null) {
			throw new Error('QUESTION_NOT_FOUND');
		}

		// 受信者のみ更新可能
		if (question.recipientId !== userId) {
			throw new Error('ACCESS_DENIED');
		}

		await this.noqQuestionsRepository.update(
			{ id: questionId },
			{
				status: 'answered' as NoqQuestionStatus,
				encryptedAnswer,
				answeredAt: new Date(),
			},
		);

		// 暗号化回答の場合、質問者にDM通知を送信（復号ツールリンク付き）
		if (question.senderId) {
			this.sendEncryptedAnswerDmNotification(question.senderId).catch(err => {
				console.error('[Noqestion] Encrypted answer DM notification failed:', err);
			});
		}

		return await this.noqQuestionsRepository.findOneByOrFail({ id: questionId });
	}

	/**
	 * 暗号化回答DM通知を送信
	 * - 質問箱用ボットアカウントから質問者へvisibility: specifiedのノートを送信
	 * - 復号ツールリンクを含む
	 */
	@bindThis
	private async sendEncryptedAnswerDmNotification(senderId: MiUser['id']): Promise<void> {
		// Meta情報を取得
		const meta = await this.metaService.fetch(true);

		// ボットアカウントが未設定の場合はスキップ
		if (!meta.noqBotAccountId) {
			return;
		}

		// ボットアカウントと質問者の情報を取得
		const [botAccount, sender] = await Promise.all([
			this.usersRepository.findOneBy({ id: meta.noqBotAccountId }),
			this.usersRepository.findOneBy({ id: senderId }),
		]);

		// ボットアカウントまたは質問者が見つからない場合はスキップ
		if (!botAccount || !sender) {
			return;
		}

		// DM本文を作成（復号ツールリンク付き）
		const dmText = `暗号化された質問に回答があったにゃん！\n復号ツールで確認してね：\nhttps://${this.config.host}/noq/decryption`;

		try {
			// visibility: specifiedのノートを作成（DM相当）
			await this.noteCreateService.create(botAccount, {
				text: dmText,
				visibility: 'specified',
				visibleUsers: [{ id: sender.id, host: sender.host, uri: sender.uri, username: sender.username }],
			});
		} catch (err) {
			// DM送信に失敗してもエラーをログに記録するだけで処理を継続
			console.error('[Noqestion] Failed to send encrypted answer DM notification:', err);
		}
	}

	/**
	 * 質問を削除
	 */
	@bindThis
	public async deleteQuestion(
		questionId: NoqQuestion['id'],
		userId: MiUser['id'],
	): Promise<void> {
		const question = await this.noqQuestionsRepository.findOneBy({ id: questionId });

		if (question == null) {
			throw new Error('QUESTION_NOT_FOUND');
		}

		// 受信者のみ削除可能
		if (question.recipientId !== userId) {
			throw new Error('ACCESS_DENIED');
		}

		await this.noqQuestionsRepository.update(
			{ id: questionId },
			{ status: 'deleted' as NoqQuestionStatus },
		);
	}

	// ========================================
	// ミュート関連
	// ========================================

	/**
	 * 質問箱用のミュートを追加
	 */
	@bindThis
	public async muteUser(userId: MiUser['id'], mutedUserId: MiUser['id']): Promise<void> {
		if (userId === mutedUserId) {
			throw new Error('CANNOT_MUTE_SELF');
		}

		const existing = await this.noqMutedUsersRepository.findOneBy({ userId, mutedUserId });
		if (existing) {
			return; // 既にミュート済み
		}

		const mutedUser = new NoqMutedUser({
			id: this.idService.gen(),
			userId,
			mutedUserId,
		});

		await this.noqMutedUsersRepository.insert(mutedUser);
	}

	/**
	 * 質問箱用のミュートを解除
	 */
	@bindThis
	public async unmuteUser(userId: MiUser['id'], mutedUserId: MiUser['id']): Promise<void> {
		await this.noqMutedUsersRepository.delete({ userId, mutedUserId });
	}

	/**
	 * 質問箱用のミュートリストを取得
	 */
	@bindThis
	public async getMutedUsers(userId: MiUser['id']): Promise<NoqMutedUser[]> {
		return await this.noqMutedUsersRepository.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});
	}

	// ========================================
	// ヘルパーメソッド
	// ========================================

	/**
	 * ブロック関係をチェック（双方向）
	 */
	@bindThis
	private async isBlocked(userAId: MiUser['id'], userBId: MiUser['id']): Promise<boolean> {
		const blocking = await this.blockingsRepository.findOne({
			where: [
				{ blockerId: userAId, blockeeId: userBId },
				{ blockerId: userBId, blockeeId: userAId },
			],
		});

		return blocking != null;
	}

	/**
	 * ミュート関係をチェック（質問箱用ミュート + 通常ミュート）
	 */
	@bindThis
	private async isMuted(senderId: MiUser['id'], recipientId: MiUser['id']): Promise<boolean> {
		// 質問箱用ミュートをチェック
		const noqMuted = await this.noqMutedUsersRepository.findOneBy({
			userId: recipientId,
			mutedUserId: senderId,
		});

		if (noqMuted) {
			return true;
		}

		// 通常ミュートをチェック
		const muted = await this.mutingsRepository.findOneBy({
			muterId: recipientId,
			muteeId: senderId,
		});

		return muted != null;
	}

	/**
	 * NGワードが含まれているかチェック
	 */
	@bindThis
	private containsNgWord(text: string, ngWordList: string[]): boolean {
		if (ngWordList.length === 0) {
			return false;
		}

		const lowerText = text.toLowerCase();
		return ngWordList.some(word => lowerText.includes(word.toLowerCase()));
	}
}
