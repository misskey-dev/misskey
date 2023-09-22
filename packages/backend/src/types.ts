/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * note - 通知オンにしているユーザーが投稿した
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
export const notificationTypes = ['note', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app', 'test'] as const;
export const obsoleteNotificationTypes = ['pollVote', 'groupInvited'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export const ffVisibility = ['public', 'followers', 'private'] as const;
