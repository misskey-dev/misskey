/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import type { Channels, StreamEvents } from 'misskey-js';

type AnyOf<T extends Record<any, any>> = T[keyof T];
type OmitFirst<T extends any[]> = T extends [any, ...infer R] ? R : never;

/**
 * Websocket無効化時に使うStreamのモック（なにもしない）
 */
export class StreamMock extends EventEmitter<StreamEvents> {
	public readonly state = 'initializing';

	constructor(...args: ConstructorParameters<typeof Misskey.Stream>) {
		super();
		// do nothing
	}

	public useChannel<C extends keyof Channels>(channel: C, params?: Channels[C]['params'], name?: string): ChannelConnectionMock<Channels[C]> {
		return new ChannelConnectionMock(this, channel, name);
	}

	public removeSharedConnection(connection: any): void {
		// do nothing
	}

	public removeSharedConnectionPool(pool: any): void {
		// do nothing
	}

	public disconnectToChannel(): void {
		// do nothing
	}

	public send(typeOrPayload: string): void
	public send(typeOrPayload: string, payload: any): void
	public send(typeOrPayload: Record<string, any> | any[]): void
	public send(typeOrPayload: string | Record<string, any> | any[], payload?: any): void {
		// do nothing
	}

	public ping(): void {
		// do nothing
	}

	public heartbeat(): void {
		// do nothing
	}

	public close(): void {
		// do nothing
	}
}

class ChannelConnectionMock<Channel extends AnyOf<Channels> = any> extends EventEmitter<Channel['events']>{
	public id = '';

	constructor(stream: StreamMock, ...args: OmitFirst<ConstructorParameters<typeof Misskey.ChannelConnection<Channel>>>) {
		super();
		// do nothing
	}

	public send<T extends keyof Channel['receives']>(type: T, body: Channel['receives'][T]): void {
		// do nothing
	}

	public dispose(): void {
		// do nothing
	}
}
