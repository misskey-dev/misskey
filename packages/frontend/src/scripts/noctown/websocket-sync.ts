/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useStream } from '@/stream.js';
import type { PlayerData, DroppedItemData, PlacedItemData, NpcData, ChunkData } from './engine.js';

export type NoctownEventType =
	| 'playerMoved'
	| 'playerJoined'
	| 'playerLeft'
	| 'playerStatusChanged'
	| 'itemDropped'
	| 'itemPicked'
	| 'itemPlaced'
	| 'npcSpawned'
	| 'npcDespawned'
	| 'questCompleted'
	| 'emotionBroadcast'
	| 'noteBubble'
	| 'chunkGenerated'
	| 'tradeRequest';

// 仕様: トレードリクエストイベントの型定義
export interface TradeRequestData {
	tradeId: string;
	initiatorId: string;
	initiatorUserId: string;
	offeredItems: Array<{ itemId: string; quantity: number }>;
	offeredCurrency: number;
	message: string | null;
	expiresAt: string;
}

export interface NoctownSyncState {
	isConnected: boolean;
	playerId: string | null;
	lastSyncTime: number;
}

export interface EmotionData {
	playerId: string;
	emoji: string;
	isCustomEmoji: boolean;
}

export interface NoteBubbleData {
	playerId: string;
	text: string;
	noteId: string;
}

type EventHandler<T> = (data: T) => void;

export class WebSocketSyncManager {
	private stream: ReturnType<typeof useStream> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private connection: any = null;
	private state: NoctownSyncState = {
		isConnected: false,
		playerId: null,
		lastSyncTime: 0,
	};

	// Event handlers
	private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();

	// Position throttling
	private lastPositionSend = 0;
	private positionSendInterval = 100; // ms
	private pendingPosition: { x: number; y: number; z: number; rotation: number } | null = null;

	// Heartbeat
	private heartbeatInterval: ReturnType<typeof window.setInterval> | null = null;
	private heartbeatIntervalMs = 30000;

	// Chunk generation (T040: concurrent request limit)
	private pendingChunkRequests: Map<string, { retryCount: number; timeoutId: ReturnType<typeof window.setTimeout> | null }> = new Map();
	private static readonly MAX_CONCURRENT_CHUNK_REQUESTS = 5;
	private static readonly MAX_CHUNK_REQUEST_RETRIES = 10;
	private static readonly CHUNK_REQUEST_RETRY_INTERVAL_MS = 2000; // 2秒ごとにリトライ

	// Reconnection settings (Misskey stream handles actual reconnection)
	private static readonly MAX_RECONNECT_ATTEMPTS = 3;
	private reconnectAttempts = 0;
	private onDisconnectCallback: (() => void) | null = null;

	constructor() {
		// Initialize handler maps
		const eventTypes: NoctownEventType[] = [
			'playerMoved', 'playerJoined', 'playerLeft', 'playerStatusChanged',
			'itemDropped', 'itemPicked', 'itemPlaced',
			'npcSpawned', 'npcDespawned', 'questCompleted',
			'emotionBroadcast', 'noteBubble', 'chunkGenerated',
			'tradeRequest',
		];
		for (const type of eventTypes) {
			this.handlers.set(type, new Set());
		}
	}

	public async connect(): Promise<void> {
		if (this.connection) {
			return;
		}

		this.stream = useStream();
		this.connection = this.stream.useChannel('noctown');

		// Set up stream connection state listeners
		this.setupStreamStateListeners();

		// Set up event listeners
		this.setupEventListeners();

		// Start heartbeat
		this.startHeartbeat();

		this.state.isConnected = true;
		this.reconnectAttempts = 0;
	}

	private setupStreamStateListeners(): void {
		if (!this.stream) return;

		// Listen for stream disconnection
		this.stream.on('_disconnected_', () => {
			console.log('Noctown: Stream disconnected, waiting for reconnection...');
			this.state.isConnected = false;
			this.reconnectAttempts++;

			// If too many reconnection attempts by the underlying stream, switch to offline mode
			if (this.reconnectAttempts >= WebSocketSyncManager.MAX_RECONNECT_ATTEMPTS) {
				console.log('Noctown: Too many reconnection attempts, switching to offline mode');
				if (this.onDisconnectCallback) {
					this.onDisconnectCallback();
				}
			}
		});

		// Listen for stream reconnection
		this.stream.on('_connected_', () => {
			console.log('Noctown: Stream reconnected');
			this.state.isConnected = true;
			this.reconnectAttempts = 0;
		});
	}

	private setupEventListeners(): void {
		if (!this.connection) return;

		// Player events
		this.connection.on('playerMoved', (data: PlayerData) => {
			// FR-010: 自プレイヤーの移動イベントは自分自身に対しては無視
			if (data.id === this.state.playerId) return;
			this.emit('playerMoved', data);
		});

		this.connection.on('playerOnline', (data: PlayerData) => {
			this.emit('playerJoined', data);
		});

		// FR-007-6: オフライン時は画面からプレイヤーを削除
		this.connection.on('playerOffline', (data: { playerId: string }) => {
			this.emit('playerLeft', data);
		});

		// Item events
		this.connection.on('itemDropped', (data: DroppedItemData) => {
			this.emit('itemDropped', data);
		});

		this.connection.on('itemPicked', (data: { droppedItemId: string; playerId: string }) => {
			this.emit('itemPicked', data);
		});

		this.connection.on('itemPlaced', (data: PlacedItemData) => {
			this.emit('itemPlaced', data);
		});

		// NPC events
		this.connection.on('npcSpawned', (data: NpcData) => {
			this.emit('npcSpawned', data);
		});

		this.connection.on('npcDespawned', (data: { npcId: string }) => {
			this.emit('npcDespawned', data);
		});

		// Quest events
		this.connection.on('questCompleted', (data: { playerId: string; questId: string; rewardCoins: number }) => {
			this.emit('questCompleted', data);
		});

		// Emotion events
		this.connection.on('emotion', (data: EmotionData) => {
			this.emit('emotionBroadcast', data);
		});

		// Note bubble events
		this.connection.on('noteBubble', (data: NoteBubbleData) => {
			this.emit('noteBubble', data);
		});

		// Chunk generation events (T038)
		this.connection.on('chunkGenerated', (data: ChunkData) => {
			// Remove from pending requests
			const key = `${data.chunkX},${data.chunkZ}`;
			const pending = this.pendingChunkRequests.get(key);
			if (pending?.timeoutId) {
				window.clearTimeout(pending.timeoutId);
			}
			this.pendingChunkRequests.delete(key);

			this.emit('chunkGenerated', data);
		});

		// 仕様: トレードリクエストイベント
		this.connection.on('tradeRequest', (data: TradeRequestData) => {
			console.log('[Noctown Trade] Received trade request:', data);
			this.emit('tradeRequest', data);
		});
	}

	public on<T>(event: NoctownEventType, handler: EventHandler<T>): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.add(handler as EventHandler<unknown>);
		}
	}

	public off<T>(event: NoctownEventType, handler: EventHandler<T>): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.delete(handler as EventHandler<unknown>);
		}
	}

	private emit(event: string, data: unknown): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			for (const handler of handlers) {
				try {
					handler(data);
				} catch (e) {
					console.error(`Error in ${event} handler:`, e);
				}
			}
		}
		this.state.lastSyncTime = Date.now();
	}

	// Send methods
	public sendPosition(x: number, y: number, z: number, rotation: number): void {
		const now = Date.now();

		// Throttle position updates
		if (now - this.lastPositionSend < this.positionSendInterval) {
			this.pendingPosition = { x, y, z, rotation };
			return;
		}

		this.doSendPosition(x, y, z, rotation);
		this.lastPositionSend = now;
		this.pendingPosition = null;
	}

	private doSendPosition(x: number, y: number, z: number, rotation: number): void {
		if (!this.connection || !this.state.isConnected) return;

		try {
			this.connection.send('move', { x, y, z, rotation });
		} catch (e) {
			console.error('Failed to send position:', e);
		}
	}

	public flushPendingPosition(): void {
		if (this.pendingPosition) {
			this.doSendPosition(
				this.pendingPosition.x,
				this.pendingPosition.y,
				this.pendingPosition.z,
				this.pendingPosition.rotation,
			);
			this.pendingPosition = null;
		}
	}

	public sendPickItem(droppedItemId: string): void {
		if (!this.connection || !this.state.isConnected) return;

		try {
			this.connection.send('pickItem', { droppedItemId });
		} catch (e) {
			console.error('Failed to send pick item:', e);
		}
	}

	public sendPlaceItem(playerItemId: string, x: number, y: number, z: number, rotation: number): void {
		if (!this.connection || !this.state.isConnected) return;

		try {
			this.connection.send('placeItem', { playerItemId, x, y, z, rotation });
		} catch (e) {
			console.error('Failed to send place item:', e);
		}
	}

	public sendInteract(targetType: string, targetId: string): void {
		if (!this.connection || !this.state.isConnected) return;

		try {
			this.connection.send('interact', { targetType, targetId });
		} catch (e) {
			console.error('Failed to send interact:', e);
		}
	}

	public sendEmotion(emoji: string, isCustomEmoji: boolean): void {
		if (!this.connection || !this.state.isConnected) return;

		try {
			this.connection.send('emotion', { emoji, isCustomEmoji });
		} catch (e) {
			console.error('Failed to send emotion:', e);
		}
	}

	/**
	 * Request chunk generation (T040)
	 * Returns false if request limit reached
	 */
	public sendGenerateChunk(chunkX: number, chunkZ: number, worldId = 'default'): boolean {
		if (!this.connection || !this.state.isConnected) return false;

		const key = `${chunkX},${chunkZ}`;

		// T040: Check concurrent request limit
		if (this.pendingChunkRequests.size >= WebSocketSyncManager.MAX_CONCURRENT_CHUNK_REQUESTS) {
			console.warn(`Chunk request limit reached (${WebSocketSyncManager.MAX_CONCURRENT_CHUNK_REQUESTS}), skipping chunk ${key}`);
			return false;
		}

		// Skip if already requested
		if (this.pendingChunkRequests.has(key)) {
			return false;
		}

		try {
			this.connection.send('generateChunk', { chunkX, chunkZ, worldId });

			// Start retry mechanism with timeout
			this.scheduleChunkRequestRetry(chunkX, chunkZ, worldId, 0);

			return true;
		} catch (e) {
			console.error('Failed to send generate chunk:', e);
			return false;
		}
	}

	/**
	 * Schedule a retry for chunk generation request
	 * Retries up to MAX_CHUNK_REQUEST_RETRIES times with CHUNK_REQUEST_RETRY_INTERVAL_MS interval
	 */
	private scheduleChunkRequestRetry(chunkX: number, chunkZ: number, worldId: string, retryCount: number): void {
		const key = `${chunkX},${chunkZ}`;

		const timeoutId = window.setTimeout(() => {
			// Check if chunk was already received
			if (!this.pendingChunkRequests.has(key)) {
				return;
			}

			// Check retry limit
			if (retryCount >= WebSocketSyncManager.MAX_CHUNK_REQUEST_RETRIES) {
				console.warn(`Chunk request timeout after ${retryCount} retries: ${key}`);
				this.pendingChunkRequests.delete(key);
				return;
			}

			// Check connection state
			if (!this.connection || !this.state.isConnected) {
				console.warn(`Connection lost while retrying chunk request: ${key}`);
				this.pendingChunkRequests.delete(key);
				return;
			}

			// Retry the request
			try {
				console.log(`Retrying chunk request (${retryCount + 1}/${WebSocketSyncManager.MAX_CHUNK_REQUEST_RETRIES}): ${key}`);
				this.connection.send('generateChunk', { chunkX, chunkZ, worldId });

				// Schedule next retry
				this.scheduleChunkRequestRetry(chunkX, chunkZ, worldId, retryCount + 1);
			} catch (e) {
				console.error(`Failed to retry chunk request: ${key}`, e);
				this.pendingChunkRequests.delete(key);
			}
		}, WebSocketSyncManager.CHUNK_REQUEST_RETRY_INTERVAL_MS);

		// Store the timeout ID so it can be cancelled if the chunk arrives
		this.pendingChunkRequests.set(key, { retryCount, timeoutId });
	}

	private startHeartbeat(): void {
		if (this.heartbeatInterval) {
			window.clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = window.setInterval(() => {
			if (!this.connection || !this.state.isConnected) return;

			try {
				this.connection.send('heartbeat', {});
			} catch (e) {
				console.error('Failed to send heartbeat:', e);
			}
		}, this.heartbeatIntervalMs);
	}

	public getState(): Readonly<NoctownSyncState> {
		return { ...this.state };
	}

	public isConnected(): boolean {
		return this.state.isConnected;
	}

	public disconnect(): void {
		if (this.heartbeatInterval) {
			window.clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		// Clear all pending chunk request timeouts
		for (const [key, pending] of this.pendingChunkRequests.entries()) {
			if (pending.timeoutId) {
				window.clearTimeout(pending.timeoutId);
			}
		}
		this.pendingChunkRequests.clear();

		// Flush any pending position
		this.flushPendingPosition();

		if (this.connection) {
			this.connection.dispose();
			this.connection = null;
		}

		this.state.isConnected = false;
		this.stream = null;
		this.reconnectAttempts = 0;
	}

	/**
	 * Set callback for when connection is permanently lost (after all retry attempts)
	 * This is called when switching to offline/NPC mode
	 */
	public setOnDisconnect(callback: () => void): void {
		this.onDisconnectCallback = callback;
	}

	/**
	 * Reset reconnection counter (e.g., when user manually triggers reconnect)
	 */
	public resetReconnectAttempts(): void {
		this.reconnectAttempts = 0;
	}
}

// Singleton instance
let instance: WebSocketSyncManager | null = null;

export function getWebSocketSyncManager(): WebSocketSyncManager {
	if (!instance) {
		instance = new WebSocketSyncManager();
	}
	return instance;
}

export function disposeWebSocketSyncManager(): void {
	if (instance) {
		instance.disconnect();
		instance = null;
	}
}
