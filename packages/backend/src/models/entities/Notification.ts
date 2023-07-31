/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from '@/types.js';
import { User } from './User.js';
import { Note } from './Note.js';
import { FollowRequest } from './FollowRequest.js';
import { AccessToken } from './AccessToken.js';

export type Notification = {
	id: string;

	// RedisのためDateではなくstring
	createdAt: string;

	/**
	 * 通知の送信者(initiator)
	 */
	notifierId: User['id'] | null;

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
	 */
	type: typeof notificationTypes[number];

	noteId: Note['id'] | null;

	followRequestId: FollowRequest['id'] | null;

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
	appAccessTokenId: AccessToken['id'] | null;
}
