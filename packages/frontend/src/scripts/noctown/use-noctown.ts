/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { useStream } from '@/stream.js';
import * as os from '@/os.js';
import { NoctownEngine, type PlayerData, type ChunkData } from './engine.js';

// 仕様: T008 WebSocket新規イベント用の型定義

// トレードリクエストイベント（受信者向け）
interface TradeRequestEvent {
	tradeId: string;
	initiatorId: string;
	initiatorUserId: string;
	offeredItems: Array<{ itemId: string; quantity: number }>;
	offeredCurrency: number;
	message: string | null;
	expiresAt: string;
}

// T008: トレードリクエスト送信確認イベント（送信者向け）
interface TradeRequestSentEvent {
	tradeId: string;
	targetId: string;
	targetUsername: string;
	status: 'pending';
	expiresAt: string;
}

// T008: トレード承認イベント（両者向け）
interface TradeAcceptedEvent {
	tradeId: string;
	initiatorId: string;
	targetId: string;
	initiatorUsername: string;
	targetUsername: string;
}

// T008: トレード拒否イベント（送信者向け）
interface TradeDeclinedEvent {
	tradeId: string;
	targetId: string;
	targetUsername: string;
}

// T008: トレードアイテム変更イベント（相手向け）
interface TradeItemsChangedEvent {
	tradeId: string;
	items: Array<{ itemId: string; itemName: string; quantity: number }>;
	currency: number;
	isFromInitiator: boolean;
}

// T008: トレード確認イベント（相手向け）
interface TradeConfirmedEvent {
	tradeId: string;
	confirmedBy: string; // playerId
	confirmedByUsername: string;
}

// T008: トレード確認リセットイベント（相手向け）
interface TradeConfirmResetEvent {
	tradeId: string;
	resetBy: string; // playerId
}

// T008: トレード完了イベント（両者向け）
interface TradeCompletedEvent {
	tradeId: string;
	initiatorId: string;
	targetId: string;
}

// T008: トレードキャンセルイベント（相手向け）
interface TradeCancelledEvent {
	tradeId: string;
	cancelledBy: string; // playerId
	reason?: 'user_cancelled' | 'disconnected' | 'expired';
}

// T008: プレイヤートレード状態変更イベント（全員向け）
interface PlayerTradingStatusChangedEvent {
	playerId: string;
	isTrading: boolean;
}

// T015: インベントリアイテムの型定義
export interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	imageUrl: string | null;
	rarity: number;
	quantity: number;
	acquiredAt: string;
}

// T017: ファームアクションの種類
export type FarmActionType = 'fish' | 'plant' | 'water' | 'harvest';

// T017: ファームアクション結果の型定義
export interface FarmActionResult {
	success: boolean;
	message: string;
	item?: {
		id: string;
		name: string;
		rarity: number;
	} | null;
}

// T014: 送信済みトレードの状態（承認待ちトースト用）
export interface PendingTradeState {
	tradeId: string;
	targetId: string;
	targetUsername: string;
	expiresAt: string;
}

// T014: 受信トレードリクエストの状態（承認確認トースト用）
export interface IncomingTradeRequest {
	tradeId: string;
	initiatorId: string;
	initiatorUsername: string;
	itemCount: number;
	currency: number;
	message: string | null;
	expiresAt: string;
}

export interface NoctownState {
	isConnected: Ref<boolean>;
	isLoading: Ref<boolean>;
	error: Ref<string | null>;
	playerData: Ref<PlayerData | null>;
	// T015: インベントリ状態
	inventory: Ref<InventoryItem[]>;
	// プレイヤー座標を公開（FarmPanel等で使用）
	playerPosition: Ref<{ x: number; y: number; z: number }>;
	// FR-014: エモーション/チャット時に表示中プレイヤーにPingを送信
	sendPingToVisiblePlayers: () => void;
	// T016: インベントリを取得
	fetchInventory: () => Promise<void>;
	// T017: ファームアクションを実行
	performFarmAction: (action: FarmActionType, params?: Record<string, unknown>) => Promise<FarmActionResult>;
	// 仕様: トレードリクエスト受信時のコールバックを設定
	setOnTradeRequest: (callback: (() => void) | null) => void;
	// T014: 送信済みトレード状態（承認待ちトースト表示用）
	pendingTrade: Ref<PendingTradeState | null>;
	// T014: 受信トレードリクエスト（承認確認トースト表示用）
	incomingTradeRequest: Ref<IncomingTradeRequest | null>;
	// T014: トレードリクエスト送信確認イベント時のコールバック
	setOnTradeRequestSent: (callback: ((data: PendingTradeState) => void) | null) => void;
	// T014: 送信済みトレードをクリア
	clearPendingTrade: () => void;
	// T014: 受信トレードリクエストをクリア
	clearIncomingTradeRequest: () => void;
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
	name: string | null;
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
 * FR-025: Local storage key for forced joystick display
 * When user touches the screen on a device not detected as mobile/tablet,
 * this flag is set to force joystick display on subsequent visits
 */
const FORCE_JOYSTICK_STORAGE_KEY = 'noctown:forceJoystick';

/**
 * FR-029: Distance threshold for recording chat messages (in blocks)
 * Messages from players further than this distance are not recorded
 */
const CHAT_HISTORY_DISTANCE_THRESHOLD = 20;

/**
 * FR-025: Check if forced joystick display is enabled via localStorage
 * @returns true if localStorage has noctown:forceJoystick set to 'true'
 */
export function isForceJoystickEnabled(): boolean {
	try {
		return localStorage.getItem(FORCE_JOYSTICK_STORAGE_KEY) === 'true';
	} catch {
		// localStorage is unavailable (e.g., private browsing mode, storage quota exceeded)
		return false;
	}
}

/**
 * FR-025: Enable forced joystick display and persist to localStorage
 * Called when touchstart event is detected on a non-mobile device
 */
export function enableForceJoystick(): void {
	try {
		localStorage.setItem(FORCE_JOYSTICK_STORAGE_KEY, 'true');
	} catch {
		// localStorage is unavailable, setting will not persist
		console.debug('Failed to persist forceJoystick setting to localStorage');
	}
}

/**
 * FR-029: Record a received chat message to the server (noctown_chat_log_recipient table)
 * Called when a message is received within 50 blocks distance
 * @param messageId The message ID to record as received
 */
async function recordChatReceipt(messageId: string): Promise<void> {
	try {
		const token = getToken();
		if (!token) {
			console.warn('[Noctown Chat] No token available for recording chat receipt');
			return;
		}

		const response = await window.fetch('/api/noctown/chat-log/receive', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: token,
				messageId,
			}),
		});

		if (!response.ok) {
			console.warn('[Noctown Chat] Failed to record chat receipt:', response.status, await response.text());
		} else {
			const result = await response.json();
			console.debug('[Noctown Chat] Receipt recorded:', result);
		}
	} catch (e) {
		console.warn('[Noctown Chat] Error recording chat receipt:', e);
	}
}

/**
 * Desktop device detection utility
 * Detects desktop PCs (Windows, Mac, Linux) based on UserAgent patterns
 * @returns true if the device is clearly a desktop PC
 */
export function isDesktopDevice(): boolean {
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	// Desktop OS patterns (Windows, Mac without touch, Linux desktop)
	const windowsRegex = /Windows NT/i;
	const macRegex = /Macintosh.*Mac OS X/i;
	const linuxDesktopRegex = /Linux.*X11/i;
	const chromeOsRegex = /CrOS/i;

	// Check for desktop OS
	const isWindows = windowsRegex.test(userAgent);
	const isMac = macRegex.test(userAgent);
	const isLinuxDesktop = linuxDesktopRegex.test(userAgent);
	const isChromeOs = chromeOsRegex.test(userAgent);

	// 仕様: iPadOS 13+はUserAgentが「Macintosh」と報告されるため、ontouchendとmaxTouchPointsで判定
	const isMacWithTouch = isMac && ('ontouchend' in document || navigator.maxTouchPoints > 1);

	// Return true for desktop OS, but exclude Mac with touch (iPad)
	return (isWindows || (isMac && !isMacWithTouch) || isLinuxDesktop || isChromeOs);
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

	// 仕様: iPadOS 13+はUserAgentが「Macintosh」と報告されるため、ontouchendとmaxTouchPointsで判定
	const isMacWithTouch = /Macintosh/i.test(userAgent) && ('ontouchend' in document || navigator.maxTouchPoints > 1);

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

	// 仕様: iPadOS 13+はUserAgentが「Macintosh」と報告されるため、ontouchendとmaxTouchPointsで判定
	const isMacWithTouch = /Macintosh/i.test(userAgent) && ('ontouchend' in document || navigator.maxTouchPoints > 1);

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
	// T015: インベントリ状態
	const inventory = ref<InventoryItem[]>([]);
	// プレイヤー座標を公開（FarmPanel等で使用）
	const playerPosition = ref({ x: 0, y: 0, z: 0 });
	// T014: 送信済みトレード状態（承認待ちトースト表示用）
	const pendingTrade = ref<PendingTradeState | null>(null);
	// T014: 受信トレードリクエスト（承認確認トースト表示用）
	const incomingTradeRequest = ref<IncomingTradeRequest | null>(null);

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

	// 仕様: トレードリクエスト受信時のコールバック
	let onTradeRequestCallback: (() => void) | null = null;
	// T014: トレードリクエスト送信確認イベント時のコールバック
	let onTradeRequestSentCallback: ((data: PendingTradeState) => void) | null = null;

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
	let worldId: string | null = null; // Set from player data

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
				name: null,
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
			// プレイヤー座標を公開用refに反映
			playerPosition.value = { x: currentX, y: currentY, z: currentZ };

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

			// FR-029: チャットメッセージ受信時の距離判定・履歴記録
			channel.on('playerChatted', (body: {
				playerId: string;
				userId: string;
				message: string;
				messageId?: string;
				positionX: number;
				positionY: number;
				positionZ: number;
			}) => {
				handlePlayerChatted(body);
			});

			// 仕様: トレード状態変更イベント
			channel.on('playerTradingStatusChanged', (body: {
				playerId: string;
				isTrading: boolean;
			}) => {
				handlePlayerTradingStatusChanged(body);
			});

			// 仕様: トレードリクエスト受信イベント
			channel.on('tradeRequest', (body: TradeRequestEvent) => {
				handleTradeRequest(body);
			});

			// T014: トレードリクエスト送信確認イベント（送信者向け）
			channel.on('tradeRequestSent', (body: {
				tradeId: string;
				targetId: string;
				targetUsername: string;
				status: string;
				expiresAt: string;
			}) => {
				handleTradeRequestSent(body);
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

	// T038: Handle chunkGenerated event and render terrain
	function handleChunkGenerated(data: ChunkData): void {
		if (!engine) return;

		// Mark chunk as loaded (T039: cache)
		const chunkKey = `${data.chunkX},${data.chunkZ}`;
		loadedChunks.add(chunkKey);

		// Render terrain
		engine.loadChunk(data);

		// FR-035: チャンク領域のアイテムもロード
		loadItemsInChunk(data.chunkX, data.chunkZ);
	}

	// FR-035: チャンク領域のドロップアイテムと設置アイテムをロード
	async function loadItemsInChunk(chunkX: number, chunkZ: number): Promise<void> {
		if (!engine) return;

		const token = getToken();
		if (!token) return;

		const centerX = (chunkX + 0.5) * CHUNK_SIZE;
		const centerZ = (chunkZ + 0.5) * CHUNK_SIZE;
		const radius = CHUNK_SIZE;

		try {
			// ドロップアイテム取得
			const droppedRes = await window.fetch('/api/noctown/item/dropped', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: token, x: centerX, z: centerZ, radius }),
			});

			if (droppedRes.ok) {
				const droppedItems = await droppedRes.json();
				for (const item of droppedItems) {
					engine.addDroppedItem(item);
				}
			}

			// 設置アイテム取得
			const placedRes = await window.fetch('/api/noctown/item/placed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: token, x: centerX, z: centerZ, radius }),
			});

			if (placedRes.ok) {
				const placedItems = await placedRes.json();
				for (const item of placedItems) {
					engine.addPlacedItem(item);
				}
			}
		} catch (e) {
			console.error('[Noctown] Failed to load items in chunk:', chunkX, chunkZ, e);
		}
	}

	// FR-014: Ping受信時に即座にPongを返送
	// 送信者が画面に表示されていなければ、PlayerDataを取得して追加する
	async function handlePlayerPingReceived(data: { senderPlayerId: string; pingId: string }): Promise<void> {
		if (!channel || !isConnected.value || !playerData.value || !engine) return;

		// 送信者が既に画面に表示されているか確認
		const senderExists = engine.hasRemotePlayer(data.senderPlayerId);

		// 表示されていなければ、PlayerDataを取得して追加
		if (!senderExists) {
			try {
				const res = await window.fetch('/api/noctown/players/get', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'same-origin',
					body: JSON.stringify({
						i: getToken(),
						playerId: data.senderPlayerId,
					}),
				});

				if (res.ok) {
					const playerInfo: NoctownNearbyPlayer = await res.json();
					console.log(`Player ${playerInfo.username} was not visible, adding to scene from ping`);
					engine.addRemotePlayer(playerInfo);
				}
			} catch (e) {
				console.error('Failed to fetch sender player data:', e);
			}
		}

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

	// FR-029: チャットメッセージ受信時の距離判定・履歴記録
	// 自分の位置から50ブロック以内のメッセージのみサーバーに記録
	function handlePlayerChatted(data: {
		playerId: string;
		userId: string;
		message: string;
		messageId?: string;
		positionX: number;
		positionY: number;
		positionZ: number;
	}): void {
		// messageIdがない場合は記録しない（旧バージョン互換）
		if (!data.messageId) return;

		// 自分自身のメッセージはバックエンドで自動登録されるためスキップ
		if (playerData.value && data.playerId === playerData.value.id) {
			return;
		}

		// 距離を計算（XZ平面での距離）
		const dx = data.positionX - currentX;
		const dz = data.positionZ - currentZ;
		const distance = Math.sqrt(dx * dx + dz * dz);

		// 仕様: FR-029 デバッグ用ログ
		console.debug('[Noctown Chat] Received chat from player:', data.playerId,
			'at', data.positionX, data.positionZ,
			'my position:', currentX, currentZ,
			'distance:', distance.toFixed(2),
			'threshold:', CHAT_HISTORY_DISTANCE_THRESHOLD);

		// 50ブロック以内の場合のみサーバーに受信記録を送信
		if (distance <= CHAT_HISTORY_DISTANCE_THRESHOLD) {
			console.debug('[Noctown Chat] Recording receipt for messageId:', data.messageId);
			recordChatReceipt(data.messageId);
		} else {
			console.debug('[Noctown Chat] Message too far, not recording. Distance:', distance.toFixed(2));
		}
	}

	// 仕様: プレイヤーのトレード状態変更を処理
	function handlePlayerTradingStatusChanged(data: {
		playerId: string;
		isTrading: boolean;
	}): void {
		if (!engine) return;
		console.debug('[Noctown Trade] Trading status changed:', data.playerId, data.isTrading);
		engine.updatePlayerTradingStatus(data.playerId, data.isTrading);
	}

	// 仕様: トレードリクエスト受信時の処理
	async function handleTradeRequest(data: TradeRequestEvent): Promise<void> {
		console.log('[Noctown Trade] Received trade request:', data);

		// アイテム数と通貨のサマリーを作成
		const itemCount = data.offeredItems.reduce((sum, item) => sum + item.quantity, 0);
		let summary = `${itemCount}個のアイテム`;
		if (data.offeredCurrency > 0) {
			summary += ` + ${data.offeredCurrency}G`;
		}

		// 通知を表示
		await os.alert({
			type: 'info',
			title: 'トレードリクエスト',
			text: `新しいトレードリクエストが届きました！\n${summary}\n\nトレードパネルを開いて確認してください。`,
		});

		// 仕様: コールバックを呼び出してトレードリストを更新
		if (onTradeRequestCallback) {
			onTradeRequestCallback();
		}
	}

	// 仕様: トレードリクエスト受信時のコールバックを設定
	function setOnTradeRequest(callback: (() => void) | null): void {
		onTradeRequestCallback = callback;
	}

	// T014: トレードリクエスト送信確認イベント時のコールバックを設定
	function setOnTradeRequestSent(callback: ((data: PendingTradeState) => void) | null): void {
		onTradeRequestSentCallback = callback;
	}

	// T014: トレードリクエスト送信確認イベントの処理
	function handleTradeRequestSent(data: {
		tradeId: string;
		targetId: string;
		targetUsername: string;
		status: string;
		expiresAt: string;
	}): void {
		console.log('[Noctown Trade] Trade request sent:', data);

		// 送信済みトレード状態を更新（承認待ちトースト表示用）
		const pendingState: PendingTradeState = {
			tradeId: data.tradeId,
			targetId: data.targetId,
			targetUsername: data.targetUsername,
			expiresAt: data.expiresAt,
		};
		pendingTrade.value = pendingState;

		// コールバックを呼び出し
		if (onTradeRequestSentCallback) {
			onTradeRequestSentCallback(pendingState);
		}
	}

	// T014: 送信済みトレードをクリア
	function clearPendingTrade(): void {
		pendingTrade.value = null;
	}

	// T014: 受信トレードリクエストをクリア
	function clearIncomingTradeRequest(): void {
		incomingTradeRequest.value = null;
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

	// T016: インベントリを取得
	async function fetchInventory(): Promise<void> {
		try {
			const res = await window.fetch('/api/noctown/item/inventory', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken() }),
			});

			if (res.ok) {
				inventory.value = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch inventory:', e);
		}
	}

	// T017: ファームアクションを実行
	// action: 'fish' | 'plant' | 'water' | 'harvest'
	// params: アクション固有のパラメータ（例: plantの場合はseedItemId）
	async function performFarmAction(action: FarmActionType, params?: Record<string, unknown>): Promise<FarmActionResult> {
		const endpoints: Record<FarmActionType, string> = {
			fish: '/api/noctown/fishing/catch',
			plant: '/api/noctown/farm/plant',
			water: '/api/noctown/farm/water',
			harvest: '/api/noctown/farm/harvest',
		};

		try {
			const res = await window.fetch(endpoints[action], {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					i: getToken(),
					x: currentX,
					z: currentZ,
					...params,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				return {
					success: false,
					message: errorData.error?.message || 'アクションに失敗しました',
				};
			}

			const data = await res.json();
			// アクション成功後、インベントリを更新
			await fetchInventory();

			return {
				success: true,
				message: data.message || 'アクションが完了しました',
				item: data.item || null,
			};
		} catch (e) {
			console.error(`Failed to perform farm action ${action}:`, e);
			return {
				success: false,
				message: 'ネットワークエラーが発生しました',
			};
		}
	}

	// T036-T037: Load nearby chunks using WebSocket chunk generation
	async function loadNearbyChunks(x: number, z: number): Promise<void> {
		if (!channel || !isConnected.value || !worldId) return;

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

			// プレイヤー座標を公開用refに反映
			playerPosition.value = { x: currentX, y: currentY, z: currentZ };

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
		// T015: インベントリ状態
		inventory,
		// プレイヤー座標を公開（FarmPanel等で使用）
		playerPosition,
		// FR-014: エモーション/チャット時に表示中プレイヤーにPingを送信
		sendPingToVisiblePlayers,
		// T016: インベントリを取得
		fetchInventory,
		// T017: ファームアクションを実行
		performFarmAction,
		// 仕様: トレードリクエスト受信時のコールバックを設定
		setOnTradeRequest,
		// T014: 送信済みトレード状態（承認待ちトースト表示用）
		pendingTrade,
		// T014: 受信トレードリクエスト（承認確認トースト表示用）
		incomingTradeRequest,
		// T014: トレードリクエスト送信確認イベント時のコールバック
		setOnTradeRequestSent,
		// T014: 送信済みトレードをクリア
		clearPendingTrade,
		// T014: 受信トレードリクエストをクリア
		clearIncomingTradeRequest,
	};
}
