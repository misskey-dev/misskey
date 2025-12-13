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
				<div v-if="!isLoading && !error" :class="$style.coordinateDisplay">
					X: {{ currentX.toFixed(1) }}, Y: {{ currentY.toFixed(1) }}
				</div>

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

				<!-- T028: Virtual joystick for mobile devices -->
				<NoctownJoystick
					v-if="isMobile"
					@move="handleJoystickMove"
					@end="handleJoystickEnd"
				/>

				<!-- Place mode indicator -->
				<div v-if="placeMode" :class="$style.placeModeIndicator">
					<i class="ti ti-box"></i>
					<span>クリックで設置 / ESCでキャンセル</span>
				</div>
			</div>
			<div :class="$style.controls">
				<div :class="$style.controlHint">
					<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {{ noctownI18n.moveHint }}</span>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import MkNoctownInventory from '@/components/MkNoctownInventory.vue';
import MkNoctownQuestPanel from '@/components/MkNoctownQuestPanel.vue';
import MkNoctownNpcDialog from '@/components/MkNoctownNpcDialog.vue';
import MkNoctownFarmPanel from '@/components/MkNoctownFarmPanel.vue';
import NoctownJoystick from '@/components/MkNoctown/NoctownJoystick.vue';
import { useStream } from '@/stream.js';
import { isMobileDevice } from '@/scripts/noctown/use-noctown.js';
import { $i } from '@/i.js';
import { apiUrl } from '@@/js/config.js';
import type { PlayerData, ChunkData, DroppedItemData, PlacedItemData, NpcData } from '@/scripts/noctown/engine.js';

// Noctown locale (type-safe access)
const noctownI18n = {
	connected: '接続中',
	loading: 'ゲームを読み込み中...',
	moveHint: 'で移動',
};

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

// Selected item for placing
let selectedItemForPlace: { id: string; itemId: string } | null = null;

// Engine and streaming
let engine: import('@/scripts/noctown/engine.js').NoctownEngine | null = null;
let stream: ReturnType<typeof useStream> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
let moveInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// Movement state
// T045: Make coordinates reactive for UI display
const currentX = ref(0);
const currentY = ref(0);
const currentZ = ref(0);
let currentRotation = 0;
const moveSpeed = 0.15;

// T027, T028: Mobile device detection
const isMobile = computed(() => isMobileDevice());

// T030: Joystick movement state
let joystickMovement = { x: 0, z: 0 };

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

		// Check if user is logged in
		if (!$i) {
			throw new Error('ログインが必要です');
		}

		// Fetch player data using noctownApi helper
		const data = await noctownApi<NoctownPlayerResponse>('noctown/player');
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

		isLoading.value = false;
	} catch (e) {
		console.error('Failed to initialize Noctown:', e);
		error.value = e instanceof Error ? e.message : 'Unknown error';
		isLoading.value = false;
	}
}

async function connectStream(): Promise<void> {
	stream = useStream();
	connection = stream.useChannel('noctown');

	// Handle incoming events
	connection.on('playerMoved', (body: PlayerData) => {
		handlePlayerMoved(body);
	});
	connection.on('playerJoined', (body: PlayerData) => {
		handlePlayerJoined(body);
	});
	connection.on('playerLeft', (body: { playerId: string }) => {
		handlePlayerLeft(body);
	});
	// T017: Handle playerStatusChanged event for online/offline transitions
	connection.on('playerStatusChanged', (body: PlayerData) => {
		handlePlayerStatusChanged(body);
	});
	connection.on('itemDropped', (body: DroppedItemData) => {
		if (engine) engine.addDroppedItem(body);
	});
	connection.on('itemPicked', (body: { droppedItemId: string }) => {
		if (engine) engine.removeDroppedItem(body.droppedItemId);
	});

	isConnected.value = true;

	// Start movement loop
	startMovementLoop();

	// Start heartbeat
	startHeartbeat();

	// Fetch nearby players
	await fetchNearbyPlayers();
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

// T017, T018: Handle player status change (online/offline transition)
function handlePlayerStatusChanged(data: PlayerData): void {
	if (!engine || data.id === playerData.value?.id) return;
	// Update player's online status visual effects
	engine.setPlayerOnlineStatus(data.id, data.isOnline);
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

async function loadNearbyChunks(x: number, z: number): Promise<void> {
	const chunkX = Math.floor(x / 16);
	const chunkZ = Math.floor(z / 16);

	// Load 3x3 chunks around player
	for (let dx = -1; dx <= 1; dx++) {
		for (let dz = -1; dz <= 1; dz++) {
			try {
				const chunk = await noctownApi<ChunkData>('noctown/map/chunk', {
					chunkX: chunkX + dx,
					chunkZ: chunkZ + dz,
				});
				if (engine) {
					engine.loadChunk(chunk);
				}
			} catch (e) {
				console.error(`Failed to load chunk ${chunkX + dx},${chunkZ + dz}:`, e);
			}
		}
	}
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

	moveInterval = setInterval(() => {
		if (!engine || !isConnected.value) return;

		// T030: Combine keyboard and joystick input
		const keyboardInput = engine.getMovementInput();

		// Merge keyboard and joystick inputs
		let finalInput = { x: 0, z: 0, rotation: currentRotation };

		if (joystickMovement.x !== 0 || joystickMovement.z !== 0) {
			// Use joystick input (mobile)
			finalInput.x = joystickMovement.x;
			finalInput.z = joystickMovement.z;
			// Calculate rotation from joystick direction
			if (joystickMovement.x !== 0 || joystickMovement.z !== 0) {
				finalInput.rotation = Math.atan2(joystickMovement.x, joystickMovement.z);
			}
		} else if (engine.isMoving()) {
			// Use keyboard input (PC)
			finalInput = keyboardInput;
		} else {
			// No movement
			return;
		}

		// Update local position
		currentX.value += finalInput.x * moveSpeed;
		currentZ.value += finalInput.z * moveSpeed;
		if (finalInput.x !== 0 || finalInput.z !== 0) {
			currentRotation = finalInput.rotation;
		}

		// Update engine
		engine.updateLocalPlayerPosition(currentX.value, currentY.value, currentZ.value, currentRotation);

		// Send to server (throttled)
		const now = Date.now();
		if (now - lastSendTime >= sendInterval) {
			sendPosition();
			lastSendTime = now;
		}
	}, 16); // ~60fps
}

function sendPosition(): void {
	if (!connection || !isConnected.value) return;

	try {
		connection.send('move', {
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
		if (!connection || !isConnected.value) return;
		connection.send('heartbeat', {});
	}, 30000); // Every 30 seconds
}

function handleKeyDown(e: KeyboardEvent): void {
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
		} else if (showNpcDialog.value) {
			closeNpcDialog();
		} else if (showFarmPanel.value) {
			showFarmPanel.value = false;
		}
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

function handleFarmUpdated(): void {
	// Refresh nearby items when farm is updated
	loadNearbyItems(currentX.value, currentZ.value);
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
	if (!connection) return;
	connection.send('pickItem', {
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

	if (connection) {
		connection.dispose();
		connection = null;
	}

	if (engine) {
		engine.dispose();
		engine = null;
	}

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
	height: calc(100vh - 60px);
	min-height: 400px;

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
