/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class SlackNotificationService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public async sendSignupErrorNotification(error: {
		username?: string;
		message: string;
		ip?: string;
		userAgent?: string;
		timestamp: Date;
	}): Promise<void> {
		if (!this.config.slack?.enableSignupErrorNotification || !this.config.slack?.botToken) {
			return;
		}

		const blocks = [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '🚨 サインアップエラー発生'
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*エラーメッセージ:* ${error.message}`
					},
					{
						type: 'mrkdwn',
						text: `*ユーザー名:* ${error.username || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*IPアドレス:* ${error.ip || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*発生時刻:* ${error.timestamp.toLocaleString('ja-JP')}`
					}
				]
			}
		];

		if (error.userAgent) {
			const userAgent = error.userAgent.length > 100 ? error.userAgent.substring(0, 100) + '...' : error.userAgent;
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*User Agent:* \`${userAgent}\``
				}
			});
		}

		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*サーバー:* ${this.config.url}`
			}
		});

		try {
			await this.httpRequestService.send('https://slack.com/api/chat.postMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.slack.botToken}`,
				},
				body: JSON.stringify({
					channel: this.config.slack.channelId,
					blocks: blocks,
					text: `サインアップエラー発生: ${error.message}`,
				}),
			});
		} catch (err) {
			console.error('Failed to send Slack notification:', err);
		}
	}

	@bindThis
	public async sendSignupSuccessNotification(user: {
		username: string;
		ip?: string;
		timestamp: Date;
	}): Promise<void> {
		if (!this.config.slack?.enableSignupErrorNotification || !this.config.slack?.botToken) {
			return;
		}

		const blocks = [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '🎉 新規ユーザー登録完了'
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*ユーザー名:* @${user.username}`
					},
					{
						type: 'mrkdwn',
						text: `*IPアドレス:* ${user.ip || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*登録時刻:* ${user.timestamp.toLocaleString('ja-JP')}`
					},
					{
						type: 'mrkdwn',
						text: `*サーバー:* ${this.config.url}`
					}
				]
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'button',
						text: {
							type: 'plain_text',
							text: 'プロフィールを表示'
						},
						url: `${this.config.url}/@${user.username}`,
						action_id: 'view_profile'
					}
				]
			}
		];

		try {
			await this.httpRequestService.send('https://slack.com/api/chat.postMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.slack.botToken}`,
				},
				body: JSON.stringify({
					channel: this.config.slack.channelId,
					blocks: blocks,
					text: `新規ユーザー登録: @${user.username}`,
				}),
			});
		} catch (err) {
			console.error('Failed to send Slack notification:', err);
		}
	}

	@bindThis
	public async sendFrontendError(data: {
		type: string;
		message: string;
		userAgent?: string;
		timestamp: string;
		ip?: string;
		url?: string;
		username?: string;
	}): Promise<void> {
		if (!this.config.slack?.enableSignupErrorNotification || !this.config.slack?.botToken) {
			return;
		}

		const blocks = [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: '🔴 フロントエンドエラー'
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*エラータイプ:*\n${data.type}`
					},
					{
						type: 'mrkdwn',
						text: `*メッセージ:*\n${data.message}`
					},
					{
						type: 'mrkdwn',
						text: `*IPアドレス:*\n${data.ip || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*発生時刻:*\n${data.timestamp}`
					}
				]
			}
		];

		if (data.username) {
			blocks[1].fields?.push({
				type: 'mrkdwn',
				text: `*ユーザー:*\n@${data.username}`
			});
		}

		if (data.url) {
			blocks[1].fields?.push({
				type: 'mrkdwn',
				text: `*URL:*\n${data.url}`
			});
		}

		if (data.userAgent) {
			const userAgent = data.userAgent.length > 200 ? data.userAgent.substring(0, 200) + '...' : data.userAgent;
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*User Agent:*\n\`\`\`${userAgent}\`\`\``
				}
			});
		}

		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `サーバー: ${this.config.url}`
			}
		});

		try {
			await this.httpRequestService.send('https://slack.com/api/chat.postMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.slack.botToken}`,
				},
				body: JSON.stringify({
					channel: this.config.slack.channelId,
					blocks: blocks,
					text: `フロントエンドエラー: ${data.type} - ${data.message}`,
				}),
			});
		} catch (err) {
			console.error('Failed to send Slack notification:', err);
		}
	}
}
