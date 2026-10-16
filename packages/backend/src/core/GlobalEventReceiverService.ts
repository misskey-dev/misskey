/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import Logger from '@/logger.js';
import { deepClone } from '@/misc/clone.js';
import type { GlobalEvents, StreamChannels } from '@/core/GlobalEventService.js';

export type GlobalEventMessage = {
	channel: StreamChannels;
	message: unknown;
};

type InternalEventPayload = GlobalEvents['internal']['payload'];

/**
 * GlobalEventService で publish されたイベントを受信し、パースしてから emit する。
 */
@Injectable()
export class GlobalEventReceiverService {
	private logger = new Logger('globalEvent');
	private messageListeners = new Set<(message: GlobalEventMessage) => void>();
	private internalEventListeners = new Set<(payload: InternalEventPayload) => void>();

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
	) {
		this.redisForSub.on('message', this.onRedisMessage);
	}

	@bindThis
	private onRedisMessage(_: string, data: string): void {
		const obj = JSON.parse(data) as GlobalEventMessage;

		// キャッシュの無効化などを先に済ませるため、internal イベントの受信側から呼ぶ
		if (obj.channel === 'internal') {
			const payload = obj.message as InternalEventPayload;
			for (const listener of this.internalEventListeners) {
				this.callListener(() => listener(deepClone(payload)));
			}
		}

		for (const listener of this.messageListeners) {
			this.callListener(() => listener(obj));
		}
	}

	/** ある受信側で例外が起きても、他の受信側 (キャッシュの無効化など) が呼ばれなくならないようにする */
	@bindThis
	private callListener(fn: () => void): void {
		try {
			fn();
		} catch (err) {
			this.logger.error(err instanceof Error ? err : new Error(String(err)));
		}
	}

	/**
	 * すべてのイベントを受信する。
	 * 渡されるオブジェクトは onMessage で登録した受信側の間で共有されるため、変更してはならない。
	 */
	@bindThis
	public onMessage(listener: (message: GlobalEventMessage) => void): void {
		this.messageListeners.add(listener);
	}

	@bindThis
	public offMessage(listener: (message: GlobalEventMessage) => void): void {
		this.messageListeners.delete(listener);
	}

	/**
	 * internal チャンネルのイベントのみを受信する。
	 */
	@bindThis
	public onInternalEvent(listener: (payload: InternalEventPayload) => void): void {
		this.internalEventListeners.add(listener);
	}

	@bindThis
	public offInternalEvent(listener: (payload: InternalEventPayload) => void): void {
		this.internalEventListeners.delete(listener);
	}
}
