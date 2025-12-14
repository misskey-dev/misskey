<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 100%;">
		<div :class="$style.container">
			<div :class="$style.header">
				<img src="https://noc.ski/files/cbb6135b-31f5-4367-8702-8910c72c8d62" :class="$style.logo"/>
				<div :class="$style.headerActions">
					<button :class="$style.iconBtn" @click="toggleQuestPanel">
						<i class="ti ti-list-check"></i>
					</button>
					<button :class="$style.iconBtn" @click="toggleInventory">
						<i class="ti ti-backpack"></i>
					</button>
					<button :class="$style.iconBtn" @click="toggleFarmPanel">
						<i class="ti ti-plant"></i>
					</button>
					<div v-if="isConnected" :class="$style.status">
						<i class="ti ti-circle-filled" style="color: #4ade80; font-size: 10px;"></i>
						<span>{{ noctownI18n.connected }}</span>
					</div>
				</div>
			</div>
			<div ref="canvasContainer" :class="$style.gameCanvas">
				<!-- Three.js canvas will be mounted here -->
				<!-- T044, T045, T047, T048: Player coordinate display (top-left) -->
				<!-- FR-014, FR-015: Display X, Y, Z coordinates (Y is height, X/Z are horizontal position) -->
				<div v-if="!isLoading && !error" :class="$style.coordinateDisplay">
					X: {{ currentX.toFixed(1) }}, Y: {{ currentY.toFixed(1) }}, Z: {{ currentZ.toFixed(1) }}
				</div>

				<!-- FR-016: Reload button (top-right, safe-area aware) -->
				<button
					v-if="!isLoading && !error"
					:class="[$style.reloadButton, { [$style.reloadButtonDisabled]: isReloading || reloadCooldown }]"
					:disabled="isReloading || reloadCooldown"
					@click="handleReload"
				>
					<i v-if="isReloading" class="ti ti-loader-2" :class="$style.reloadSpinner"></i>
					<i v-else class="ti ti-refresh"></i>
				</button>

				<div v-if="isLoading" :class="$style.overlay">
					<MkLoading/>
					<p>{{ noctownI18n.loading }}</p>
				</div>
				<div v-else-if="error" :class="$style.overlay">
					<i class="ti ti-alert-triangle" style="font-size: 48px; color: #f87171;"></i>
					<p style="color: #f87171;">{{ error }}</p>
					<MkButton @click="retry">{{ i18n.ts.retry }}</MkButton>
				</div>

				<!-- Inventory panel -->
				<MkNoctownInventory
					v-if="showInventory"
					ref="inventoryRef"
					@close="showInventory = false"
					@place="handlePlaceItem"
					@drop="handleDropItem"
				/>

				<!-- Quest panel -->
				<MkNoctownQuestPanel
					v-if="showQuestPanel"
					ref="questPanelRef"
					@close="showQuestPanel = false"
					@questCompleted="handleQuestCompleted"
				/>

				<!-- NPC Dialog -->
				<MkNoctownNpcDialog
					v-if="showNpcDialog && selectedNpc"
					:npc="selectedNpc"
					@close="closeNpcDialog"
					@questStarted="handleQuestStarted"
				/>

				<!-- Farm Panel -->
				<MkNoctownFarmPanel
					v-if="showFarmPanel"
					:playerX="currentX"
					:playerZ="currentZ"
					@closed="showFarmPanel = false"
					@farmUpdated="handleFarmUpdated"
				/>

				<!-- T028: Virtual joystick for mobile/tablet devices without physical keyboard -->
				<NoctownJoystick
					v-if="shouldShowJoystick"
					@move="handleJoystickMove"
					@end="handleJoystickEnd"
				/>

				<!-- Place mode indicator -->
				<div v-if="placeMode" :class="$style.placeModeIndicator">
					<i class="ti ti-box"></i>
					<span>クリックで設置 / ESCでキャンセル</span>
				</div>

				<!-- T151: Chat input component -->
				<NoctownChatInput
					@send="handleChatSend"
					@focused="chatInputFocused = true"
					@blurred="chatInputFocused = false"
					@input="handleChatInput"
				/>

				<!-- FR-018: Player info floating window -->
				<MkNoctownPlayerInfoWindow
					v-if="showPlayerInfoWindow && selectedPlayerInfo"
					:playerId="selectedPlayerInfo.playerId"
					:name="selectedPlayerInfo.name"
					:username="selectedPlayerInfo.username"
					:avatarUrl="selectedPlayerInfo.avatarUrl"
					:pingTime="selectedPlayerPingTime"
					:isPinging="isPlayerInfoPinging"
					@close="handleClosePlayerInfoWindow"
					@ping="handleManualPing"
				/>

				<!-- Emotion buttons -->
				<div :class="$style.emotionPanel">
					<button
						v-for="emoji in emotionEmojis"
						:key="emoji"
						:class="$style.emotionBtn"
						@click="showEmotion(emoji)"
					>
						{{ emoji }}
					</button>
				</div>
			</div>
			<div :class="$style.controls">
				<div :class="$style.controlHint">
					<span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> {{ noctownI18n.moveHint }}</span>
					<span><kbd>I</kbd> インベントリ</span>
					<span><kbd>Q</kbd> クエスト</span>
					<span><kbd>F</kbd> 農場</span>
					<span><kbd>E</kbd> 拾う/話す</span>
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import MkNoctownInventory from '@/components/MkNoctownInventory.vue';
import MkNoctownQuestPanel from '@/components/MkNoctownQuestPanel.vue';
import MkNoctownNpcDialog from '@/components/MkNoctownNpcDialog.vue';
import MkNoctownFarmPanel from '@/components/MkNoctownFarmPanel.vue';
import MkNoctownPlayerInfoWindow from '@/components/MkNoctownPlayerInfoWindow.vue';
import NoctownJoystick from '@/components/MkNoctown/NoctownJoystick.vue';
import NoctownChatInput from '@/components/MkNoctown/NoctownChatInput.vue';
import { useStream } from '@/stream.js';
import { isMobileDevice, hasPhysicalKeyboard } from '@/scripts/noctown/use-noctown.js';
import { $i } from '@/i.js';
import { apiUrl } from '@@/js/config.js';
import type { PlayerData, ChunkData, DroppedItemData, PlacedItemData, NpcData } from '@/scripts/noctown/engine.js';

// Noctown locale (type-safe access)
const noctownI18n = {
	connected: '接続中',
	loading: 'ゲームを読み込み中...',
	moveHint: 'で移動',
};

// Emotion emojis (6 emotions: 😊❗❓💢💕👋)
const emotionEmojis = ['😊', '❗', '❓', '💢', '💕', '👋'];

const canvasContainer = ref<HTMLElement | null>(null);
const isConnected = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const playerData = ref<PlayerData | null>(null);
const showInventory = ref(false);
const showQuestPanel = ref(false);
const showNpcDialog = ref(false);
const showFarmPanel = ref(false);
const placeMode = ref(false);
const inventoryRef = ref<{ refresh: () => void } | null>(null);
const questPanelRef = ref<{ refresh: () => void } | null>(null);
const selectedNpc = ref<NpcData | null>(null);
const chatInputFocused = ref(false);
let worldId: string | null = null; // Set from player data

// FR-016: Reload button state
const isReloading = ref(false);
const reloadCooldown = ref(false);

// Selected item for placing
let selectedItemForPlace: { id: string; itemId: string } | null = null;

// Engine and streaming
let engine: import('@/scripts/noctown/engine.js').NoctownEngine | null = null;
let stream: ReturnType<typeof useStream> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connection = ref<any>(null); // Use ref like drawing chat for better reactivity
let moveInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// FR-017: Ping/pong for player status mark color
let pingInterval: ReturnType<typeof setInterval> | null = null;
let warningCheckInterval: ReturnType<typeof setInterval> | null = null;
// Track pending pings: pingId -> { playerId, timeoutId }
const pendingPings = new Map<string, { playerId: string; timeoutId: ReturnType<typeof setTimeout> }>();
const PING_TIMEOUT_MS = 5000; // 5秒タイムアウト

// FR-018: Player info floating window
const showPlayerInfoWindow = ref(false);
const selectedPlayerInfo = ref<{
	playerId: string;
	name: string | null;
	username: string;
	avatarUrl: string | null;
} | null>(null);
const selectedPlayerPingTime = ref<number | null>(null);
const isPlayerInfoPinging = ref(false);
// Track pending pings for player info window (separate from status mark pings)
const pendingPlayerInfoPings = new Map<string, { playerId: string; sentTime: number; timeoutId: ReturnType<typeof setTimeout> }>();

// FR-019: Typing indicator state
let isTyping = false;
let typingDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let typingAutoHideTimeout: ReturnType<typeof setTimeout> | null = null;

// Movement state
// T045: Make coordinates reactive for UI display
const currentX = ref(0);
const currentY = ref(0);
const currentZ = ref(0);
let currentRotation = 0;
const moveSpeed = 0.15;

// T027, T028: Mobile/tablet device detection for virtual joystick
// Show joystick on mobile/tablet devices that don't have a physical keyboard
const shouldShowJoystick = ref(false);

// T030: Joystick movement state
let joystickMovement = { x: 0, z: 0 };

// T039: Cache loaded chunks in memory to avoid redundant database queries
const loadedChunks = new Set<string>();
const CHUNK_SIZE = 16;
const CHUNK_LOAD_DISTANCE = 2; // Load chunks 2 chunks ahead

interface NoctownPlayerResponse {
	id: string;
	username: string;
	avatarUrl: string | null;
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

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
	acquiredAt: string;
}

// Use $i token for API requests (standard Misskey pattern)
function getToken(): string | null {
	return $i?.token ?? null;
}

// Helper function for Noctown API requests
async function noctownApi<T>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
	const token = getToken();
	if (!token) {
		throw new Error('Not logged in');
	}

	const res = await window.fetch(`${apiUrl}/${endpoint}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'omit',
		cache: 'no-cache',
		body: JSON.stringify({ i: token, ...data }),
	});

	if (!res.ok) {
		const errorBody = await res.json().catch(() => ({}));
		throw new Error(errorBody.error?.message || `API error: ${res.status}`);
	}

	return res.json();
}

async function initialize(): Promise<void> {
	try {
		isLoading.value = true;
		error.value = null;

		// T027-2: Determine if virtual joystick should be shown
		// Show on mobile/tablet devices without physical keyboard
		const isMobile = isMobileDevice();
		const hasKeyboard = await hasPhysicalKeyboard();
		shouldShowJoystick.value = isMobile && !hasKeyboard;

		// Check if user is logged in
		if (!$i) {
			throw new Error('ログインが必要です');
		}

		// Fetch player data using noctownApi helper
		const data = await noctownApi<NoctownPlayerResponse>('noctown/player');
		worldId = data.worldId; // Set worldId from server response
		playerData.value = {
			id: data.id,
			userId: '',
			username: data.username,
			avatarUrl: data.avatarUrl,
			positionX: data.positionX,
			positionY: data.positionY,
			positionZ: data.positionZ,
			rotation: data.rotation,
			isOnline: data.isOnline,
		};

		currentX.value = data.positionX;
		currentY.value = data.positionY;
		currentZ.value = data.positionZ;
		currentRotation = data.rotation;

		// Dynamically import engine to avoid SSR issues
		if (canvasContainer.value) {
			const { NoctownEngine } = await import('@/scripts/noctown/engine.js');
			engine = new NoctownEngine(canvasContainer.value);
			engine.createLocalPlayer(playerData.value);

			// Load initial chunks around player
			await loadNearbyChunks(currentX.value, currentZ.value);

			// Load nearby items
			await loadNearbyItems(currentX.value, currentZ.value);

			// Load nearby NPCs
			await loadNearbyNpcs(currentX.value, currentZ.value);
		}

		// Connect to WebSocket
		await connectStream();

		// Add keyboard shortcuts
		window.addEventListener('keydown', handleKeyDown);

		// FR-018: Add canvas click/touch listener for player info window
		if (engine) {
			const rendererElement = engine.getRendererDomElement();
			rendererElement.addEventListener('click', handleCanvasClick);
			rendererElement.addEventListener('touchend', handleCanvasClick, { passive: false });
		}

		isLoading.value = false;
	} catch (e) {
		console.error('Failed to initialize Noctown:', e);
		error.value = e instanceof Error ? e.message : 'Unknown error';
		isLoading.value = false;
	}
}

async function connectStream(): Promise<void> {
	stream = useStream();
	connection.value = stream.useChannel('noctown');

	// Handle incoming events
	connection.value.on('playerMoved', (body: PlayerData) => {
		handlePlayerMoved(body);
	});
	connection.value.on('playerJoined', (body: PlayerData) => {
		handlePlayerJoined(body);
	});
	connection.value.on('playerLeft', (body: { playerId: string }) => {
		handlePlayerLeft(body);
	});
	// T038: Handle chunkGenerated event and render terrain
	connection.value.on('chunkGenerated', (body: ChunkData) => {
		handleChunkGenerated(body);
	});
	connection.value.on('itemDropped', (body: DroppedItemData) => {
		if (engine) engine.addDroppedItem(body);
	});
	connection.value.on('itemPicked', (body: { droppedItemId: string }) => {
		if (engine) engine.removeDroppedItem(body.droppedItemId);
	});
	connection.value.on('playerEmotion', (body: { playerId: string; emoji: string }) => {
		handlePlayerEmoted(body);
	});
	connection.value.on('playerChatted', (body: { playerId: string; message: string }) => {
		handlePlayerChatted(body);
	});

	// FR-019: Handle typing indicator events
	connection.value.on('typingStart', (body: { playerId: string }) => {
		handleTypingStart(body);
	});
	connection.value.on('typingEnd', (body: { playerId: string }) => {
		handleTypingEnd(body);
	});

	// FR-017: Handle pong response for player status mark color
	connection.value.on('playerPongReceived', (body: { responderPlayerId: string; pingId: string }) => {
		handlePongReceived(body);
	});

	// FR-014: Ping受信時に即座にPongを返送
	connection.value.on('playerPingReceived', (body: { senderPlayerId: string; pingId: string }) => {
		handlePlayerPingReceived(body);
	});

	isConnected.value = true;

	// Start movement loop
	startMovementLoop();

	// Start heartbeat
	startHeartbeat();

	// FR-017: Start ping/pong for status mark color
	startPingPong();
	startWarningCheck();

	// Fetch nearby players
	await fetchNearbyPlayers();
}

function handlePlayerMoved(data: PlayerData): void {
	if (!engine || data.id === playerData.value?.id) return;
	engine.updateRemotePlayer(data);
}

// FR-007-6: プレイヤー参加時は常に新規追加（オフライン時は既に削除されているため）
function handlePlayerJoined(data: PlayerData): void {
	if (!engine || data.id === playerData.value?.id) return;
	engine.addRemotePlayer(data);
}

// FR-007-6: オフライン時は画面からプレイヤーを削除
function handlePlayerLeft(data: { playerId: string }): void {
	if (!engine) return;
	engine.removeRemotePlayer(data.playerId);
}

// FR-073, FR-074: Handle chunkGenerated event and render terrain with grid
// FR-001: async修正（terrainDataに基づく地形生成のため）
async function handleChunkGenerated(data: ChunkData): Promise<void> {
	console.log('[Noctown] handleChunkGenerated: received chunk data', {
		chunkX: data.chunkX,
		chunkZ: data.chunkZ,
		worldId: data.worldId,
		biome: data.biome,
		hasTerrainData: !!data.terrainData,
		hasEnvironmentObjects: !!data.environmentObjects,
		terrainDataLength: Array.isArray(data.terrainData) ? data.terrainData.length : 'not array',
		environmentObjectsCount: Array.isArray(data.environmentObjects) ? data.environmentObjects.length : 'not array',
	});

	if (!engine) {
		console.warn('[Noctown] handleChunkGenerated: engine not initialized');
		return;
	}

	// Mark chunk as loaded (T039: cache)
	const chunkKey = `${data.chunkX},${data.chunkZ}`;
	loadedChunks.add(chunkKey);
	console.log('[Noctown] handleChunkGenerated: marked chunk as loaded', { chunkKey, totalLoadedChunks: loadedChunks.size });

	// FR-001: terrainDataに基づいて地形を生成（await追加）
	console.log('[Noctown] handleChunkGenerated: calling engine.renderChunk', { chunkX: data.chunkX, chunkZ: data.chunkZ });
	await engine.renderChunk(data);
	console.log('[Noctown] handleChunkGenerated: chunk rendered successfully', { chunkX: data.chunkX, chunkZ: data.chunkZ });

	// FR-074: VIEW_DISTANCE=2 chunk management (remove chunks outside view distance)
	const VIEW_DISTANCE = 2;
	const playerChunkX = Math.floor(currentX.value / CHUNK_SIZE);
	const playerChunkZ = Math.floor(currentZ.value / CHUNK_SIZE);

	// Remove chunks outside VIEW_DISTANCE
	for (const chunkKey of loadedChunks) {
		const [cx, cz] = chunkKey.split(',').map(Number);
		const dx = Math.abs(cx - playerChunkX);
		const dz = Math.abs(cz - playerChunkZ);

		if (dx > VIEW_DISTANCE || dz > VIEW_DISTANCE) {
			engine.removeChunk(cx, cz);
			loadedChunks.delete(chunkKey);
		}
	}
}

function handlePlayerEmoted(data: { playerId: string; emoji: string }): void {
	if (!engine) return;
	engine.showRemotePlayerEmote(data.playerId, data.emoji);
}

function handlePlayerChatted(data: { playerId: string; message: string }): void {
	if (!engine) return;
	engine.showRemotePlayerChat(data.playerId, data.message);
}

// FR-019: Handle typing indicator start event
function handleTypingStart(data: { playerId: string }): void {
	if (!engine) return;
	engine.showRemotePlayerTyping(data.playerId, true);
}

// FR-019: Handle typing indicator end event
function handleTypingEnd(data: { playerId: string }): void {
	if (!engine) return;
	engine.showRemotePlayerTyping(data.playerId, false);
}

function handleChatSend(message: string): void {
	if (!engine || !connection.value) return;

	// FR-019: Clear typing state when sending
	if (isTyping) {
		isTyping = false;
		connection.value.send('typingEnd', {});
		engine.showLocalPlayerTyping(false);
	}
	if (typingDebounceTimeout) {
		clearTimeout(typingDebounceTimeout);
		typingDebounceTimeout = null;
	}
	if (typingAutoHideTimeout) {
		clearTimeout(typingAutoHideTimeout);
		typingAutoHideTimeout = null;
	}

	// Show chat on local player
	engine.showLocalPlayerChat(message);

	// Send chat event to server via WebSocket
	connection.value.send('chat', {
		message,
	});
}

// FR-019: Handle chat input changes for typing indicator
function handleChatInput(hasText: boolean): void {
	if (!connection.value || !engine) return;

	// Clear existing timeouts
	if (typingDebounceTimeout) {
		clearTimeout(typingDebounceTimeout);
		typingDebounceTimeout = null;
	}

	if (hasText) {
		// User is typing - send typingStart if not already typing
		if (!isTyping) {
			isTyping = true;
			connection.value.send('typingStart', {});
			engine.showLocalPlayerTyping(true);
		}

		// Reset auto-hide timeout (3 seconds after last input)
		if (typingAutoHideTimeout) {
			clearTimeout(typingAutoHideTimeout);
		}
		typingAutoHideTimeout = setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				connection.value?.send('typingEnd', {});
				engine?.showLocalPlayerTyping(false);
			}
			typingAutoHideTimeout = null;
		}, 3000);
	} else {
		// User cleared input - debounce typingEnd by 500ms
		typingDebounceTimeout = setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				connection.value?.send('typingEnd', {});
				engine?.showLocalPlayerTyping(false);
			}
			if (typingAutoHideTimeout) {
				clearTimeout(typingAutoHideTimeout);
				typingAutoHideTimeout = null;
			}
			typingDebounceTimeout = null;
		}, 500);
	}
}

async function fetchNearbyPlayers(): Promise<void> {
	try {
		const players = await noctownApi<PlayerData[]>('noctown/players/nearby', {
		 x: currentX.value,
		 z: currentZ.value,
			radius: 50,
		});

		if (!engine) return;

		for (const player of players) {
			engine.addRemotePlayer(player);
		}
	} catch (e) {
		console.error('Failed to fetch nearby players:', e);
	}
}

// T036-T037: Load nearby chunks using WebSocket chunk generation
async function loadNearbyChunks(x: number, z: number): Promise<void> {
	if (!connection.value || !isConnected.value || !worldId) {
		console.warn('[Noctown] loadNearbyChunks: precondition failed', {
			hasConnection: !!connection.value,
			isConnected: isConnected.value,
			hasWorldId: !!worldId,
			worldId,
		});
		return;
	}

	const playerChunkX = Math.floor(x / CHUNK_SIZE);
	const playerChunkZ = Math.floor(z / CHUNK_SIZE);

	console.log('[Noctown] loadNearbyChunks: loading chunks around player', {
		playerX: x,
		playerZ: z,
		playerChunkX,
		playerChunkZ,
		worldId,
		loadedChunksCount: loadedChunks.size,
	});

	// T037: Request chunk generation when player approaches ungenerated area (2 chunks ahead)
	let requestedCount = 0;
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
				console.log('[Noctown] loadNearbyChunks: requesting chunk', { chunkX, chunkZ, worldId });
				connection.value.send('generateChunk', {
					chunkX,
					chunkZ,
					worldId,
				});
				requestedCount++;

				// Optimistically mark as requested (will be added to loadedChunks when chunkGenerated event arrives)
			} catch (e) {
				console.error('[Noctown] loadNearbyChunks: failed to request chunk', { chunkX, chunkZ, error: e });
			}
		}
	}

	console.log('[Noctown] loadNearbyChunks: finished requesting chunks', {
		requestedCount,
		totalLoadedChunks: loadedChunks.size,
	});
}

async function loadNearbyItems(x: number, z: number): Promise<void> {
	if (!engine) return;

	// Load dropped items
	try {
		const droppedItems = await noctownApi<DroppedItemData[]>('noctown/item/dropped', {
			x,
			z,
			radius: 30,
		});
		for (const item of droppedItems) {
			engine.addDroppedItem(item);
		}
	} catch (e) {
		console.error('Failed to load dropped items:', e);
	}

	// Load placed items
	try {
		const placedItems = await noctownApi<PlacedItemData[]>('noctown/item/placed', {
			x,
			z,
			radius: 30,
		});
		for (const item of placedItems) {
			engine.addPlacedItem(item);
		}
	} catch (e) {
		console.error('Failed to load placed items:', e);
	}
}

function startMovementLoop(): void {
	let lastSendTime = 0;
	const sendInterval = 100; // Send position every 100ms max
	let lastChunkCheckTime = 0;
	const chunkCheckInterval = 1000; // Check for new chunks every 1 second

	moveInterval = setInterval(() => {
		if (!engine || !isConnected.value) return;

		// T030: Combine keyboard and joystick input
		const keyboardInput = engine.getMovementInput();

		// Merge keyboard and joystick inputs
		let finalInput = { x: 0, z: 0, rotation: currentRotation };
		let hasJoystickInput = false;

		if (joystickMovement.x !== 0 || joystickMovement.z !== 0) {
			// Use joystick input (mobile)
			finalInput.x = joystickMovement.x;
			finalInput.z = joystickMovement.z;
			hasJoystickInput = true;
			// Calculate rotation from joystick direction
			if (joystickMovement.x !== 0 || joystickMovement.z !== 0) {
				finalInput.rotation = Math.atan2(joystickMovement.x, joystickMovement.z);
			}

			// Update engine input for joystick (for animation)
			engine.setInput({
				up: joystickMovement.z < -0.1,
				down: joystickMovement.z > 0.1,
				left: joystickMovement.x < -0.1,
				right: joystickMovement.x > 0.1,
				sprint: false,
			});
		} else if (engine.isMoving()) {
			// Use keyboard input (PC)
			finalInput = keyboardInput;
			// Keyboard input is already tracked by engine.ts via keys Set
		} else {
			// No movement - but still check for chunk loading
			const now = Date.now();
			if (now - lastChunkCheckTime >= chunkCheckInterval) {
				loadNearbyChunks(currentX.value, currentZ.value);
				lastChunkCheckTime = now;
			}
			return;
		}

		// Update local position
		currentX.value += finalInput.x * moveSpeed;
		currentZ.value += finalInput.z * moveSpeed;
		if (finalInput.x !== 0 || finalInput.z !== 0) {
			currentRotation = finalInput.rotation;
		}

		// Update engine (Y座標は地形に応じて自動調整される)
		engine.updateLocalPlayerPosition(currentX.value, currentY.value, currentZ.value, currentRotation);

		// FR-015, FR-016: Get updated Y position from engine (terrain-adjusted)
		const updatedPos = engine.getLocalPlayerPosition();
		if (updatedPos) {
			currentY.value = updatedPos.y;
		}

		// Send to server (throttled)
		const now = Date.now();
		if (now - lastSendTime >= sendInterval) {
			sendPosition();
			lastSendTime = now;
		}

		// T036: Implement player position monitoring for nearby chunk detection
		// T037: Request chunk generation when player approaches ungenerated area
		if (now - lastChunkCheckTime >= chunkCheckInterval) {
			loadNearbyChunks(currentX.value, currentZ.value);
			lastChunkCheckTime = now;
		}
	}, 16); // ~60fps
}

function sendPosition(): void {
	if (!connection.value || !isConnected.value) return;

	try {
		connection.value.send('move', {
		 x: currentX.value,
		 y: currentY.value,
		 z: currentZ.value,
			rotation: currentRotation,
		});
	} catch (e) {
		console.error('Failed to send position:', e);
	}
}

function startHeartbeat(): void {
	heartbeatInterval = setInterval(() => {
		if (!connection.value || !isConnected.value) return;
		connection.value.send('heartbeat', {});
	}, 30000); // Every 30 seconds
}

// FR-017: Start ping/pong interval for player status mark color
function startPingPong(): void {
	pingInterval = setInterval(() => {
		if (!connection.value || !isConnected.value || !engine) return;

		// Get all remote player IDs from engine
		const remotePlayerIds = engine.getRemotePlayerIds();

		for (const playerId of remotePlayerIds) {
			// 各プレイヤーごとに一意のpingIdを生成
			const pingId = `${Date.now()}-${playerId}-${Math.random().toString(36).substr(2, 9)}`;

			// タイムアウト設定
			const timeoutId = setTimeout(() => {
				// 5秒以内にpongが返ってこなかった場合、画面から削除
				if (engine) {
					engine.removeRemotePlayer(playerId);
				}
				pendingPings.delete(pingId);
			}, PING_TIMEOUT_MS);

			// Record pending ping
			pendingPings.set(pingId, { playerId, timeoutId });

			// Send ping to each remote player
			connection.value.send('playerPing', {
				targetPlayerIds: [playerId],
				pingId,
			});
		}
	}, 1000); // Every 1 second
}

// FR-017: Handle pong response and update player mark color
function handlePongReceived(data: { responderPlayerId: string; pingId: string }): void {
	if (!engine) return;

	const pendingPing = pendingPings.get(data.pingId);
	if (pendingPing) {
		// タイムアウトをクリア
		clearTimeout(pendingPing.timeoutId);
		pendingPings.delete(data.pingId);

		// Update player mark color (pongが返ってきたので正常)
		engine.updateRemotePlayerPingStatus(data.responderPlayerId, 0);
	}

	// FR-018: Check if this pong is for player info window
	for (const [pingId, pending] of pendingPlayerInfoPings) {
		if (pending.playerId === data.responderPlayerId) {
			clearTimeout(pending.timeoutId);
			const responseTime = Date.now() - pending.sentTime;
			selectedPlayerPingTime.value = responseTime;
			isPlayerInfoPinging.value = false;
			pendingPlayerInfoPings.delete(pingId);
			break;
		}
	}
}

// FR-014: Ping受信時に即座にPongを返送
function handlePlayerPingReceived(data: { senderPlayerId: string; pingId: string }): void {
	if (!connection.value || !isConnected.value) return;

	// 即座にpongを返送
	try {
		connection.value.send('playerPong', {
			senderPlayerId: data.senderPlayerId,
			pingId: data.pingId,
		});
	} catch (e) {
		console.error('Failed to send pong:', e);
	}
}

// FR-018: Handle canvas click/touch for player info window
function handleCanvasClick(event: MouseEvent | TouchEvent): void {
	if (!engine) return;

	// Don't open player info if in place mode
	if (placeMode.value) return;

	// Check if clicked/touched on a remote player
	const playerId = engine.getClickedPlayerId(event);
	if (playerId) {
		// Prevent default to avoid click event firing after touchend
		event.preventDefault();
		openPlayerInfoWindow(playerId);
	}
}

// FR-018: Open player info window
function openPlayerInfoWindow(playerId: string): void {
	if (!engine) return;

	const playerData = engine.getRemotePlayerData(playerId);
	if (!playerData) return;

	selectedPlayerInfo.value = {
		playerId: playerData.id,
		name: null, // PlayerData doesn't have name field
		username: playerData.username,
		avatarUrl: playerData.avatarUrl,
	};
	selectedPlayerPingTime.value = null;
	showPlayerInfoWindow.value = true;

	// Send ping when window opens
	sendPlayerInfoPing(playerId);
}

// FR-018: Send ping for player info window
function sendPlayerInfoPing(playerId: string): void {
	if (!connection.value) return;

	isPlayerInfoPinging.value = true;
	const pingId = `info-${Date.now()}-${playerId}`;
	const sentTime = Date.now();

	const timeoutId = setTimeout(() => {
		// 3 second timeout - mark as offline and close window
		isPlayerInfoPinging.value = false;
		if (engine) {
			engine.removeRemotePlayer(playerId);
		}
		showPlayerInfoWindow.value = false;
		selectedPlayerInfo.value = null;
		pendingPlayerInfoPings.delete(pingId);
	}, 3000);

	pendingPlayerInfoPings.set(pingId, { playerId, sentTime, timeoutId });
	connection.value.send('playerPing', {
		targetPlayerIds: [playerId],
		pingId,
	});
}

// FR-018: Close player info window
function handleClosePlayerInfoWindow(): void {
	showPlayerInfoWindow.value = false;
	selectedPlayerInfo.value = null;
	selectedPlayerPingTime.value = null;
}

// FR-018: Handle manual ping from player info window
function handleManualPing(): void {
	if (selectedPlayerInfo.value) {
		sendPlayerInfoPing(selectedPlayerInfo.value.playerId);
	}
}

// FR-017: Start warning check interval for 3+ seconds since last ping
function startWarningCheck(): void {
	warningCheckInterval = setInterval(() => {
		if (!engine) return;

		// Check all remote players for warning status
		engine.checkRemotePlayerWarnings();
	}, 1000); // Every 1 second
}

function handleKeyDown(e: KeyboardEvent): void {
	// FR-072: Disable Misskey global shortcuts when chat input is focused
	if (chatInputFocused.value) {
		// Stop event propagation to prevent Misskey shortcuts (n, p, t, etc.)
		e.stopPropagation();

		// Allow only Escape to work during chat input
		if (e.code === 'Escape') {
			// Blur chat input
			(e.target as HTMLInputElement)?.blur();
		}
		return;
	}

	if (e.code === 'KeyI') {
		toggleInventory();
	} else if (e.code === 'KeyQ') {
		toggleQuestPanel();
	} else if (e.code === 'KeyF') {
		toggleFarmPanel();
	} else if (e.code === 'KeyE') {
		tryInteract();
	} else if (e.code === 'Escape') {
		if (placeMode.value) {
			cancelPlaceMode();
		} else if (showPlayerInfoWindow.value) {
			// FR-018: Close player info window on Escape
			handleClosePlayerInfoWindow();
		} else if (showNpcDialog.value) {
			closeNpcDialog();
		} else if (showFarmPanel.value) {
			showFarmPanel.value = false;
		}
	} else if (e.code === 'Digit1') {
		showEmotion(emotionEmojis[0]);
	} else if (e.code === 'Digit2') {
		showEmotion(emotionEmojis[1]);
	} else if (e.code === 'Digit3') {
		showEmotion(emotionEmojis[2]);
	} else if (e.code === 'Digit4') {
		showEmotion(emotionEmojis[3]);
	} else if (e.code === 'Digit5') {
		showEmotion(emotionEmojis[4]);
	} else if (e.code === 'Digit6') {
		showEmotion(emotionEmojis[5]);
	}
}

function toggleInventory(): void {
	showInventory.value = !showInventory.value;
	showQuestPanel.value = false;
	if (showInventory.value && inventoryRef.value) {
		inventoryRef.value.refresh();
	}
}

function toggleQuestPanel(): void {
	showQuestPanel.value = !showQuestPanel.value;
	showInventory.value = false;
	showFarmPanel.value = false;
	if (showQuestPanel.value && questPanelRef.value) {
		questPanelRef.value.refresh();
	}
}

function toggleFarmPanel(): void {
	showFarmPanel.value = !showFarmPanel.value;
	showInventory.value = false;
	showQuestPanel.value = false;
}

function showEmotion(emoji: string): void {
	if (!engine) return;

	// Show emotion on local player
	engine.showLocalPlayerEmote(emoji);

	// Send emotion event to server via WebSocket
	if (connection.value) {
		connection.value.send('emotion', {
			emoji,
			isCustomEmoji: false,
		});
	}
}

function handleFarmUpdated(): void {
	// Refresh nearby items when farm is updated
	loadNearbyItems(currentX.value, currentZ.value);
}

// FR-016: Reload button handler
async function handleReload(): Promise<void> {
	if (isReloading.value || reloadCooldown.value) return;

	isReloading.value = true;
	try {
		// 1. Unload all chunks
		if (engine) {
			engine.unloadAllChunks();
		}

		// 2. Remove all remote players
		if (engine) {
			engine.removeAllRemotePlayers();
		}

		// 3. Clear loaded chunks cache
		loadedChunks.clear();

		// 4. Disconnect WebSocket
		if (connection.value) {
			connection.value.dispose();
			connection.value = null;
		}
		isConnected.value = false;

		// 5. Re-fetch player position from server
		const data = await noctownApi<NoctownPlayerResponse>('noctown/player');
		currentX.value = data.positionX;
		currentY.value = data.positionY;
		currentZ.value = data.positionZ;
		currentRotation = data.rotation;

		// 6. Reconnect WebSocket
		await connectStream();

		// 7. Reload chunks around player
		await loadNearbyChunks(currentX.value, currentZ.value);

		// 8. Reload nearby players
		await fetchNearbyPlayers();

		// 9. Reload nearby items
		await loadNearbyItems(currentX.value, currentZ.value);

		// 10. Reload nearby NPCs
		await loadNearbyNpcs(currentX.value, currentZ.value);
	} catch (e) {
		console.error('Failed to reload:', e);
	} finally {
		isReloading.value = false;

		// 2-second cooldown
		reloadCooldown.value = true;
		setTimeout(() => {
			reloadCooldown.value = false;
		}, 2000);
	}
}

async function tryInteract(): Promise<void> {
	if (!engine) return;

	const pos = engine.getLocalPlayerPosition();
	if (!pos) return;

	// Check for nearby NPC first
	const npc = engine.getNpcAt(pos.x, pos.z, 3);
	if (npc) {
		selectedNpc.value = npc;
		showNpcDialog.value = true;
		return;
	}

	// If no NPC, try to pick up item
	if (!connection.value) return;
	connection.value.send('pickItem', {
		droppedItemId: 'nearest',
	});
}

function closeNpcDialog(): void {
	showNpcDialog.value = false;
	selectedNpc.value = null;
}

function handleQuestStarted(questId: string): void {
	console.log('Quest started:', questId);
	if (questPanelRef.value) {
		questPanelRef.value.refresh();
	}
}

function handleQuestCompleted(questId: string, rewardCoins: number): void {
	console.log('Quest completed:', questId, 'Reward:', rewardCoins);
}

async function loadNearbyNpcs(x: number, z: number): Promise<void> {
	if (!engine) return;

	try {
		const npcs = await noctownApi<NpcData[]>('noctown/npc/nearby', {
			x,
			z,
			radius: 30,
		});
		for (const npc of npcs) {
			engine.addNpc(npc);
		}
	} catch (e) {
		console.error('Failed to load NPCs:', e);
	}
}

function handlePlaceItem(item: InventoryItem): void {
	selectedItemForPlace = { id: item.id, itemId: item.itemId };
	placeMode.value = true;
	showInventory.value = false;

	// Add click handler for placing
	canvasContainer.value?.addEventListener('click', onPlaceClick);
}

async function onPlaceClick(): Promise<void> {
	if (!placeMode.value || !selectedItemForPlace || !engine) return;

	const pos = engine.getLocalPlayerPosition();
	if (!pos) return;

	// Place item at player position (slightly in front)
	const placeX = pos.x + Math.sin(currentRotation) * 2;
	const placeZ = pos.z + Math.cos(currentRotation) * 2;

	try {
		await noctownApi('noctown/item/place', {
			playerItemId: selectedItemForPlace.id,
			x: placeX,
			y: 0,
			z: placeZ,
			rotation: currentRotation,
		});
		// Refresh items
		await loadNearbyItems(currentX.value, currentZ.value);
	} catch (e) {
		console.error('Failed to place item:', e);
	}

	cancelPlaceMode();
}

function cancelPlaceMode(): void {
	placeMode.value = false;
	selectedItemForPlace = null;
	canvasContainer.value?.removeEventListener('click', onPlaceClick);
}

async function handleDropItem(item: InventoryItem): Promise<void> {
	// For now, dropping is not implemented (would need a drop endpoint)
	console.log('Drop item:', item);
}

// T030: Joystick event handlers
function handleJoystickMove(direction: { x: number; z: number }): void {
	// Update joystick movement state
	joystickMovement = direction;
}

function handleJoystickEnd(): void {
	// Reset joystick movement when released
	joystickMovement = { x: 0, z: 0 };

	// Reset engine input (animation will return to idle)
	if (engine) {
		engine.setInput({
			up: false,
			down: false,
			left: false,
			right: false,
			sprint: false,
		});
	}
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

	// FR-017: Clear ping/pong intervals
	if (pingInterval) {
		clearInterval(pingInterval);
		pingInterval = null;
	}
	if (warningCheckInterval) {
		clearInterval(warningCheckInterval);
		warningCheckInterval = null;
	}
	// Clear all pending ping timeouts
	for (const pending of pendingPings.values()) {
		clearTimeout(pending.timeoutId);
	}
	pendingPings.clear();

	if (connection.value) {
		connection.value.dispose();
		connection.value = null;
	}

	// FR-018: Remove canvas click/touch listeners
	if (engine) {
		const rendererElement = engine.getRendererDomElement();
		rendererElement.removeEventListener('click', handleCanvasClick);
		rendererElement.removeEventListener('touchend', handleCanvasClick);
		engine.dispose();
		engine = null;
	}

	// FR-018: Clear pending player info pings
	for (const [pingId, pending] of pendingPlayerInfoPings) {
		clearTimeout(pending.timeoutId);
	}
	pendingPlayerInfoPings.clear();

	window.removeEventListener('keydown', handleKeyDown);

	isConnected.value = false;
}

function retry(): void {
	cleanup();
	initialize();
}

// FR-175: Mobile scrollbar prevention
function setupMobileScrollPrevention(): void {
	if (window.innerWidth <= 768) {
		document.body.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.width = '100%';
		document.body.style.height = '100%';
		document.documentElement.style.overflow = 'hidden';
	}
}

function cleanupMobileScrollPrevention(): void {
	document.body.style.overflow = '';
	document.body.style.position = '';
	document.body.style.width = '';
	document.body.style.height = '';
	document.documentElement.style.overflow = '';
}

onMounted(() => {
	setupMobileScrollPrevention();
	initialize();
});

onUnmounted(() => {
	cleanupMobileScrollPrevention();
	cleanup();
});

definePage(() => ({
	title: 'Noctown',
	icon: 'ti ti-cube-3d-sphere',
}));
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 100px); // Increased to 100px to prevent scrollbar
	min-height: 400px;
	overflow: hidden; // Prevent scrollbar

	// FR-175: Mobile scrollbar prevention
	@media (max-width: 768px) {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100vh;
		height: 100dvh; // Dynamic viewport height for mobile browsers
		width: 100vw;
		overflow: hidden;
		touch-action: none; // Prevent pull-to-refresh and overscroll
	}
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 16px;
}

.headerActions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.iconBtn {
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	padding: 8px 12px;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.logo {
	max-width: 150px;
	max-height: 40px;
}

.status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
}

.gameCanvas {
	flex: 1;
	position: relative;
	background: linear-gradient(180deg, #87ceeb 0%, #e0f0ff 100%);
	border-radius: 8px;
	overflow: hidden;
}

.overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	background: rgba(0, 0, 0, 0.7);
	color: var(--MI_THEME-fg);
	z-index: 10;
}

// T048: Style coordinate display with readable font and background
.coordinateDisplay {
	position: absolute;
	top: 16px;
	left: 16px;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	padding: 8px 12px;
	border-radius: 6px;
	font-family: 'Courier New', monospace;
	font-size: 14px;
	font-weight: 600;
	z-index: 100;
	pointer-events: none;
	user-select: none;
}

// FR-016: Reload button (top-right, safe-area aware)
.reloadButton {
	position: absolute;
	top: calc(env(safe-area-inset-top, 16px) + 10px);
	right: 16px;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.5);
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 20px;
	z-index: 100;
	transition: opacity 0.2s, transform 0.2s;

	&:hover {
		background: rgba(0, 0, 0, 0.7);
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}

	// Mobile: ensure minimum touch target and safe area
	@media (max-width: 768px) {
		top: calc(env(safe-area-inset-top, 10px) + 10px);
		right: 10px;
	}
}

.reloadButtonDisabled {
	opacity: 0.5;
	cursor: not-allowed;

	&:hover {
		background: rgba(0, 0, 0, 0.5);
		transform: none;
	}
}

.reloadSpinner {
	animation: reloadSpin 1s linear infinite;
}

@keyframes reloadSpin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.placeModeIndicator {
	position: absolute;
	bottom: 80px;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 8px 16px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	z-index: 50;
}

/* FR-010: Emotion panel positioned higher for better visibility */
.emotionPanel {
	position: absolute;
	bottom: 18px;
	right: 20px;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	z-index: 50;

	// FR-007-2: モバイルで親指操作しやすいよう位置を調整
	// デスクトップ（18px）→ モバイル（150px）→ 小型（150px）
	/* Mobile: Adjusted position for better thumb reach (PWA safe area aware) */
	@media (max-width: 768px) {
		bottom: 150px;
		right: 16px;
	}

	// 小型モバイル: 親指で届きやすく配置
	/* Small mobile screens: Positioned for easier reach */
	@media (max-width: 480px) {
		bottom: 150px;
		right: 12px;
		gap: 6px;
	}
}

.emotionBtn {
	width: 48px;
	height: 48px;
	font-size: 28px;
	background: rgba(255, 255, 255, 0.9);
	border: 2px solid rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(255, 255, 255, 1);
		border-color: rgba(0, 0, 0, 0.4);
		transform: scale(1.1);
	}

	&:active {
		transform: scale(0.95);
	}

	// FR-007-2: モバイルでボタンサイズを調整（タッチ操作に最適化）
	// デスクトップ（48px）→ モバイル（44px）→ 小型（40px）
	/* Mobile: Slightly smaller buttons for better touch target density */
	@media (max-width: 768px) {
		width: 44px;
		height: 44px;
		font-size: 26px;
	}

	// 小型モバイル: 小さめのボタンで密度を上げる
	/* Small mobile screens: Even smaller */
	@media (max-width: 480px) {
		width: 40px;
		height: 40px;
		font-size: 24px;
	}
}

.controls {
	padding: 8px 16px;
	display: flex;
	justify-content: center;
}

.controlHint {
	display: flex;
	gap: 16px;
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	kbd {
		display: inline-block;
		padding: 2px 6px;
		background: var(--MI_THEME-panel);
		border: 1px solid var(--MI_THEME-divider);
		border-radius: 4px;
		font-family: monospace;
		font-size: 11px;
	}
}
</style>
