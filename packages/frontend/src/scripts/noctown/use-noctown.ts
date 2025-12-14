/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { useStream } from '@/stream.js';
import { NoctownEngine, type PlayerData, type ChunkData } from './engine.js';

export interface NoctownState {
	isConnected: Ref<boolean>;
	isLoading: Ref<boolean>;
	error: Ref<string | null>;
	playerData: Ref<PlayerData | null>;
	// FR-014: エモーション/チャット時に表示中プレイヤーにPingを送信
	sendPingToVisiblePlayers: () => void;
}

interface NoctownPlayerResponse {
	id: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
	balance: string;
	totalScore: number;
	createdAt: string;
	worldId: string;
}

interface NoctownNearbyPlayer {
	id: string;
	userId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
}

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

/**
 * T027: Mobile device detection utility
 * Detects mobile phones and tablets based on UserAgent patterns
 * @returns true if the device is a mobile device (phone or tablet)
 */
export function isMobileDevice(): boolean {
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	// Tablet-specific patterns (iPad, Android tablets, Kindle, etc.)
	const tabletRegex = /iPad|Android.*Tablet|Kindle|Silk|PlayBook|BB10.*Touch/i;

	// Mobile phone patterns
	const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

	// iPadOS 13+ detection: Safari on iPad reports as "Macintosh" but has touch support
	const isMacWithTouch = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;

	// Return true for tablets, mobile phones, or iPadOS devices
	// Note: Screen width condition removed to support tablets with larger screens (768px+)
	return mobileRegex.test(userAgent) || tabletRegex.test(userAgent) || isMacWithTouch;
}

/**
 * T027-2: Physical keyboard detection utility
 * Uses Navigator Keyboard API when available, falls back to UserAgent detection
 * @returns Promise resolving to true if a physical keyboard is detected
 */
export async function hasPhysicalKeyboard(): Promise<boolean> {
	// Try Navigator Keyboard API (experimental, limited browser support)
	if ('keyboard' in navigator && 'getLayoutMap' in (navigator as any).keyboard) {
		try {
			const layoutMap = await (navigator as any).keyboard.getLayoutMap();
			// If we can get a layout map with entries, a keyboard is connected
			return layoutMap.size > 0;
		} catch (e) {
			// API call failed, fall back to UserAgent detection
			console.debug('Navigator Keyboard API unavailable, using fallback:', e);
		}
	}

	// Fallback: UserAgent-based detection
	// Tablets without keyboard = no physical keyboard
	// Desktop/laptop = has physical keyboard
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	// Tablet patterns
	const tabletRegex = /iPad|Android.*Tablet|Kindle|Silk|PlayBook|BB10.*Touch/i;

	// iPadOS 13+ detection
	const isMacWithTouch = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;

	// If it's a tablet or iPadOS device, assume no physical keyboard (conservative default)
	const isTablet = tabletRegex.test(userAgent) || isMacWithTouch;

	// Tablets default to no keyboard, desktops default to keyboard
	return !isTablet && !isMobileDevice();
}

export function useNoctown(containerRef: Ref<HTMLElement | null>): NoctownState {
	const isConnected = ref(false);
	const isLoading = ref(true);
	const error = ref<string | null>(null);
	const playerData = ref<PlayerData | null>(null);

	let engine: NoctownEngine | null = null;
	let stream: ReturnType<typeof useStream> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let channel: any = null;
	let moveInterval: ReturnType<typeof setInterval> | null = null;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	let playerSyncInterval: ReturnType<typeof setInterval> | null = null;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let reconnectAttempts = 0;
	const MAX_RECONNECT_ATTEMPTS = 10;
	const RECONNECT_DELAY_MS = 3000;

	// FR-014: Ping/Pongオフライン検出
	const PING_TIMEOUT_MS = 5000; // 5秒タイムアウト（ネットワーク遅延を考慮）
	// pingId -> { playerId, timeoutId } のマッピング（各プレイヤーごとに個別のpingIdを使用）
	const pendingPings = new Map<string, { playerId: string; timeoutId: ReturnType<typeof setTimeout> }>();

	// Movement state
	let currentX = 0;
	let currentY = 0;
	let currentZ = 0;
	let currentRotation = 0;
	const moveSpeed = 0.15;

	// T039: Cache loaded chunks in memory to avoid redundant database queries
	const loadedChunks = new Set<string>();
	const CHUNK_SIZE = 16;
	const CHUNK_LOAD_DISTANCE = 2; // Load chunks 2 chunks ahead
	let worldId = 'default'; // Will be set from player data

	async function initialize(): Promise<void> {
		try {
			isLoading.value = true;
			error.value = null;

			// Fetch player data
			const res = await window.fetch('/api/noctown/player', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken() }),
			});

			if (!res.ok) {
				throw new Error('Failed to fetch player data');
			}

			const data: NoctownPlayerResponse = await res.json();
			worldId = data.worldId; // Set worldId from server response
			playerData.value = {
				id: data.id,
				userId: '',
				username: '',
				avatarUrl: null,
				positionX: data.positionX,
				positionY: data.positionY,
				positionZ: data.positionZ,
				rotation: data.rotation,
				isOnline: data.isOnline,
			};

			currentX = data.positionX;
			currentY = data.positionY;
			currentZ = data.positionZ;
			currentRotation = data.rotation;

			// Initialize engine
			if (containerRef.value) {
				engine = new NoctownEngine(containerRef.value);
				engine.createLocalPlayer(playerData.value);

				// Load initial chunks around player
				await loadNearbyChunks(currentX, currentZ);
			}

			// Connect to WebSocket
			await connectStream();

			isLoading.value = false;
		} catch (e) {
			console.error('Failed to initialize Noctown:', e);
			error.value = e instanceof Error ? e.message : 'Unknown error';
			isLoading.value = false;
		}
	}

	async function connectStream(): Promise<void> {
		try {
			stream = useStream();
			channel = stream.useChannel('noctown');

			// Handle incoming events
			channel.on('playerMoved', (body: PlayerData) => {
				handlePlayerMoved(body);
			});
			channel.on('playerJoined', (body: PlayerData) => {
				handlePlayerJoined(body);
			});
			channel.on('playerLeft', (body: { playerId: string }) => {
				handlePlayerLeft(body);
			});
			// SC-011: View Distance外プレイヤーのオンライン同期（完全なPlayerDataを受信）
			channel.on('playerOnline', (body: PlayerData) => {
				handlePlayerOnline(body);
			});
			// SC-012: プレイヤーがオフラインになった時の処理
			channel.on('playerOffline', (body: { playerId: string }) => {
				handlePlayerOffline(body);
			});

			// T038: Handle chunkGenerated event and render terrain
			channel.on('chunkGenerated', (body: ChunkData) => {
				handleChunkGenerated(body);
			});

			// FR-014: Ping/Pongオフライン検出
			channel.on('playerPingReceived', (body: { senderPlayerId: string; pingId: string }) => {
				handlePlayerPingReceived(body);
			});
			channel.on('playerPongReceived', (body: { responderPlayerId: string; pingId: string }) => {
				handlePlayerPongReceived(body);
			});

			// Monitor connection state (check if stream object exists and has state)
			if (stream && typeof stream.on === 'function') {
				stream.on('_disconnected_', handleDisconnect);
			}

			isConnected.value = true;
			reconnectAttempts = 0;

			// Start movement loop
			startMovementLoop();

			// Start heartbeat
			startHeartbeat();

			// Start periodic player sync (includes initial fetch)
			startPlayerSync();
		} catch (e) {
			console.error('Failed to connect to stream:', e);
			scheduleReconnect();
		}
	}

	function handleDisconnect(): void {
		console.log('WebSocket disconnected, attempting to reconnect...');
		isConnected.value = false;
		scheduleReconnect();
	}

	function scheduleReconnect(): void {
		if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
			console.error('Max reconnect attempts reached');
			error.value = '接続が失われました。ページをリロードしてください。';
			return;
		}

		reconnectAttempts++;
		console.log(`Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY_MS}ms`);

		reconnectTimeout = setTimeout(async () => {
			try {
				// Cleanup old connection
				if (channel) {
					channel.dispose();
					channel = null;
				}

				// Attempt reconnection
				await connectStream();
			} catch (e) {
				console.error('Reconnect failed:', e);
				scheduleReconnect();
			}
		}, RECONNECT_DELAY_MS);
	}

	function handlePlayerMoved(data: PlayerData): void {
		if (!engine || data.id === playerData.value?.id) return;
		engine.updateRemotePlayer(data);
	}

	function handlePlayerJoined(data: PlayerData): void {
		if (!engine || data.id === playerData.value?.id) return;
		engine.addRemotePlayer(data);
	}

	function handlePlayerLeft(data: { playerId: string }): void {
		if (!engine) return;
		engine.removeRemotePlayer(data.playerId);
	}

	// SC-011: View Distance外プレイヤーのオンライン同期
	// playerOnlineイベントには完全なPlayerDataが含まれているので直接追加
	function handlePlayerOnline(data: PlayerData): void {
		if (!engine || data.id === playerData.value?.id) return;

		console.log(`Player ${data.username || data.id} came online, adding to scene`);

		// 完全なPlayerDataを使用して直接プレイヤーを追加/更新
		engine.addRemotePlayer(data);
	}

	// SC-012: プレイヤーがオフラインになった時の処理
	function handlePlayerOffline(data: { playerId: string }): void {
		if (!engine) return;

		console.log(`Player ${data.playerId} went offline, removing from scene`);

		// オフラインプレイヤーをシーンから削除
		engine.removeRemotePlayer(data.playerId);
	}

	// T038: Handle chunkGenerated event and render terrain
	function handleChunkGenerated(data: ChunkData): void {
		if (!engine) return;

		// Mark chunk as loaded (T039: cache)
		const chunkKey = `${data.chunkX},${data.chunkZ}`;
		loadedChunks.add(chunkKey);

		// Render terrain
		engine.loadChunk(data);
	}

	// FR-014: Ping受信時に即座にPongを返送
	function handlePlayerPingReceived(data: { senderPlayerId: string; pingId: string }): void {
		if (!channel || !isConnected.value || !playerData.value) return;

		// 即座にpongを返送
		try {
			channel.send('playerPong', {
				senderPlayerId: data.senderPlayerId,
				pingId: data.pingId,
			});
		} catch (e) {
			console.error('Failed to send pong:', e);
		}
	}

	// FR-014: Pong受信時にタイムアウトをクリアし、プレイヤーがオンラインであることを確認
	function handlePlayerPongReceived(data: { responderPlayerId: string; pingId: string }): void {
		const pendingPing = pendingPings.get(data.pingId);
		if (pendingPing) {
			// タイムアウトをクリア
			clearTimeout(pendingPing.timeoutId);
			pendingPings.delete(data.pingId);
		}
	}

	// FR-014: 表示中の全プレイヤーにPingを送信
	function sendPingToVisiblePlayers(): void {
		if (!channel || !isConnected.value || !engine || !playerData.value) return;

		// エンジンから表示中のプレイヤーIDリストを取得
		const visiblePlayerIds = engine.getVisiblePlayerIds();
		if (visiblePlayerIds.length === 0) return;

		// 送信するpingIdリストを収集
		const pingData: { targetPlayerId: string; pingId: string }[] = [];

		// 各プレイヤーに対して個別のpingIdを生成しタイムアウトを設定
		for (const targetPlayerId of visiblePlayerIds) {
			if (targetPlayerId === playerData.value.id) continue; // 自分自身はスキップ

			// 各プレイヤーごとに一意のpingIdを生成
			const pingId = `${Date.now()}-${targetPlayerId}-${Math.random().toString(36).substr(2, 9)}`;

			const timeoutId = setTimeout(() => {
				// SC-012: 5秒以内にpongが返ってこなかった場合、画面から削除
				console.log(`Player ${targetPlayerId} did not respond to ping, removing from view`);
				if (engine) {
					engine.removeRemotePlayer(targetPlayerId);
				}
				pendingPings.delete(pingId);
			}, PING_TIMEOUT_MS);

			pendingPings.set(pingId, { playerId: targetPlayerId, timeoutId });
			pingData.push({ targetPlayerId, pingId });
		}

		// WebSocketでpingを送信（各プレイヤーに個別のpingIdを送信）
		for (const { targetPlayerId, pingId } of pingData) {
			try {
				channel.send('playerPing', {
					targetPlayerIds: [targetPlayerId],
					pingId,
				});
			} catch (e) {
				console.error('Failed to send ping:', e);
				// エラー時はタイムアウトをクリア
				const pendingPing = pendingPings.get(pingId);
				if (pendingPing) {
					clearTimeout(pendingPing.timeoutId);
					pendingPings.delete(pingId);
				}
			}
		}
	}

	async function fetchNearbyPlayers(): Promise<void> {
		try {
			const res = await window.fetch('/api/noctown/players/nearby', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken(), x: currentX, z: currentZ, radius: 50 }),
			});

			if (!res.ok) return;

			const players: NoctownNearbyPlayer[] = await res.json();

			if (!engine) return;

			for (const player of players) {
				engine.addRemotePlayer(player);
			}
		} catch (e) {
			console.error('Failed to fetch nearby players:', e);
		}
	}

	/**
	 * Fetch all currently online players and add them to the scene
	 * This is used for:
	 * 1. Initial player load on connection
	 * 2. Periodic sync to catch players that joined while WebSocket was disconnected
	 */
	async function fetchAllOnlinePlayers(): Promise<void> {
		try {
			const res = await window.fetch('/api/noctown/players/online', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken() }),
			});

			if (!res.ok) {
				console.error('Failed to fetch online players:', res.status, res.statusText);
				return;
			}

			const players: NoctownNearbyPlayer[] = await res.json();

			if (!engine) return;

			console.log(`Syncing ${players.length} online players`);

			for (const player of players) {
				engine.addRemotePlayer(player);
			}
		} catch (e) {
			console.error('Failed to fetch all online players:', e);
		}
	}

	/**
	 * Start periodic player sync to ensure all online players are displayed
	 * Runs every 30 seconds to catch players that joined while WebSocket was disconnected
	 */
	function startPlayerSync(): void {
		// Initial fetch
		fetchAllOnlinePlayers();

		// Periodic sync every 30 seconds
		playerSyncInterval = setInterval(() => {
			fetchAllOnlinePlayers();
		}, 30000); // 30 seconds
	}

	// T036-T037: Load nearby chunks using WebSocket chunk generation
	async function loadNearbyChunks(x: number, z: number): Promise<void> {
		if (!channel || !isConnected.value) return;

		const playerChunkX = Math.floor(x / CHUNK_SIZE);
		const playerChunkZ = Math.floor(z / CHUNK_SIZE);

		// T037: Request chunk generation when player approaches ungenerated area (2 chunks ahead)
		for (let dx = -CHUNK_LOAD_DISTANCE; dx <= CHUNK_LOAD_DISTANCE; dx++) {
			for (let dz = -CHUNK_LOAD_DISTANCE; dz <= CHUNK_LOAD_DISTANCE; dz++) {
				const chunkX = playerChunkX + dx;
				const chunkZ = playerChunkZ + dz;
				const chunkKey = `${chunkX},${chunkZ}`;

				// T039: Skip if chunk already loaded (cache check)
				if (loadedChunks.has(chunkKey)) {
					continue;
				}

				// Request chunk generation via WebSocket
				// T040: Concurrent request limit is handled in websocket-sync.ts (MAX_CONCURRENT_CHUNK_REQUESTS = 5)
				try {
					channel.send('generateChunk', {
						chunkX,
						chunkZ,
						worldId,
					});

					// Optimistically mark as requested (will be added to loadedChunks when chunkGenerated event arrives)
				} catch (e) {
					console.error(`Failed to request chunk ${chunkX},${chunkZ}:`, e);
				}
			}
		}
	}

	function startMovementLoop(): void {
		let lastSendTime = 0;
		const sendInterval = 100; // Send position every 100ms max
		let lastChunkCheckTime = 0;
		const chunkCheckInterval = 1000; // Check for new chunks every 1 second

		moveInterval = setInterval(() => {
			if (!engine || !isConnected.value) return;

			const input = engine.getMovementInput();
			if (!engine.isMoving()) return;

			// Update local position
			currentX += input.x * moveSpeed;
			currentZ += input.z * moveSpeed;
			if (input.x !== 0 || input.z !== 0) {
				currentRotation = input.rotation;
			}

			// Update engine
			engine.updateLocalPlayerPosition(currentX, currentY, currentZ, currentRotation);

			// Send to server (throttled)
			const now = Date.now();
			if (now - lastSendTime >= sendInterval) {
				sendPosition();
				lastSendTime = now;
			}

			// T036: Implement player position monitoring for nearby chunk detection
			// T037: Request chunk generation when player approaches ungenerated area
			if (now - lastChunkCheckTime >= chunkCheckInterval) {
				loadNearbyChunks(currentX, currentZ);
				lastChunkCheckTime = now;
			}
		}, 16); // ~60fps
	}

	function sendPosition(): void {
		if (!channel || !isConnected.value) return;

		try {
			channel.send('move', {
				x: currentX,
				y: currentY,
				z: currentZ,
				rotation: currentRotation,
			});
		} catch (e) {
			console.error('Failed to send position:', e);
		}
	}

	function startHeartbeat(): void {
		heartbeatInterval = setInterval(() => {
			if (!channel || !isConnected.value) return;
			channel.send('heartbeat', {});
		}, 30000); // Every 30 seconds
	}

	function cleanup(): void {
		if (moveInterval) {
			clearInterval(moveInterval);
			moveInterval = null;
		}

		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}

		if (playerSyncInterval) {
			clearInterval(playerSyncInterval);
			playerSyncInterval = null;
		}

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (channel) {
			channel.dispose();
			channel = null;
		}

		if (engine) {
			engine.dispose();
			engine = null;
		}

		isConnected.value = false;
	}

	onMounted(() => {
		initialize();
	});

	onUnmounted(() => {
		cleanup();
	});

	return {
		isConnected,
		isLoading,
		error,
		playerData,
		// FR-014: エモーション/チャット時に表示中プレイヤーにPingを送信
		sendPingToVisiblePlayers,
	};
}
