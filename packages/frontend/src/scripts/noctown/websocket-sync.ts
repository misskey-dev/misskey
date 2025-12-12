/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useStream } from '@/stream.js';
import type { PlayerData, DroppedItemData, PlacedItemData, NpcData } from './engine.js';

export type NoctownEventType =
	| 'playerMoved'
	| 'playerJoined'
	| 'playerLeft'
	| 'itemDropped'
	| 'itemPicked'
	| 'itemPlaced'
	| 'npcSpawned'
	| 'npcDespawned'
	| 'questCompleted'
	| 'emotionBroadcast'
	| 'noteBubble';

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
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private heartbeatIntervalMs = 30000;

	// Reconnection settings (Misskey stream handles actual reconnection)
	private static readonly MAX_RECONNECT_ATTEMPTS = 3;
	private reconnectAttempts = 0;
	private onDisconnectCallback: (() => void) | null = null;

	constructor() {
		// Initialize handler maps
		const eventTypes: NoctownEventType[] = [
			'playerMoved', 'playerJoined', 'playerLeft',
			'itemDropped', 'itemPicked', 'itemPlaced',
			'npcSpawned', 'npcDespawned', 'questCompleted',
			'emotionBroadcast', 'noteBubble',
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
			this.emit('playerMoved', data);
		});

		this.connection.on('playerOnline', (data: PlayerData) => {
			this.emit('playerJoined', data);
		});

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

	private startHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = setInterval(() => {
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
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

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
