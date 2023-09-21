/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from '@/types.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';
import { MiFollowRequest } from './FollowRequest.js';
import { MiAccessToken } from './AccessToken.js';

export type MiNotification = {
	id: string;

	// RedisのためDateではなくstring
	createdAt: string;

	/**
	 * 通知の送信者(initiator)
	 */
	notifierId: MiUser['id'] | null;

	/**
	 * 通知の種類。
	 * follow - フォローされた
	 * mention - 投稿で自分が言及された
	 * reply - 投稿に返信された
	 * renote - 投稿がRenoteされた
	 * quote - 投稿が引用Renoteされた
	 * reaction - 投稿にリアクションされた
	 * pollEnded - 自分のアンケートもしくは自分が投票したアンケートが終了した
	 * receiveFollowRequest - フォローリクエストされた
	 * followRequestAccepted - 自分の送ったフォローリクエストが承認された
	 * achievementEarned - 実績を獲得
	 * app - アプリ通知
	 * test - テスト通知（サーバー側）
	 */
	type: typeof notificationTypes[number];

	noteId: MiNote['id'] | null;

	followRequestId: MiFollowRequest['id'] | null;

	reaction: string | null;

	choice: number | null;

	achievement: string | null;

	/**
	 * アプリ通知のbody
	 */
	customBody: string | null;

	/**
	 * アプリ通知のheader
	 * (省略時はアプリ名で表示されることを期待)
	 */
	customHeader: string | null;

	/**
	 * アプリ通知のicon(URL)
	 * (省略時はアプリアイコンで表示されることを期待)
	 */
	customIcon: string | null;

	/**
	 * アプリ通知のアプリ(のトークン)
	 */
	appAccessTokenId: MiAccessToken['id'] | null;
}
