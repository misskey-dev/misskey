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

				<!-- 仕様: TradePanelデバッグ情報（パネルが閉じても残る） -->
				<div v-if="tradePanelDebug" :class="$style.tradePanelDebugPersistent">
					{{ tradePanelDebug }}
				</div>

				<!-- FR-016: Top-right button group (inventory + chat window.history + reload + settings) -->
				<div v-if="!isLoading && !error" :class="$style.topRightButtonGroup">
					<button
						:class="$style.groupButton"
						@click="toggleInventory"
					>
						<i class="ti ti-backpack"></i>
					</button>
					<button
						:class="$style.groupButton"
						@click="toggleChatHistoryPanel"
					>
						<i class="ti ti-messages"></i>
					</button>
					<button
						:class="[$style.groupButton, { [$style.groupButtonDisabled]: isReloading || reloadCooldown }]"
						:disabled="isReloading || reloadCooldown"
						@click="handleReload"
					>
						<i v-if="isReloading" class="ti ti-loader-2" :class="$style.reloadSpinner"></i>
						<i v-else class="ti ti-refresh"></i>
					</button>
					<button
						:class="$style.groupButton"
						@click="toggleSettingsPanel"
					>
						<i class="ti ti-settings"></i>
					</button>
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
					@dropCurrency="handleDropCurrency"
				/>

				<!-- Quest panel -->
				<MkNoctownQuestPanel
					v-if="showQuestPanel"
					ref="questPanelRef"
					@close="showQuestPanel = false"
					@questCompleted="handleQuestCompleted"
				/>

				<!-- FR-029: Chat History panel -->
				<MkNoctownChatHistoryPanel
					v-if="showChatHistoryPanel"
					ref="chatHistoryPanelRef"
					@close="showChatHistoryPanel = false"
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
				<!-- layoutSwapped: false = left (default), true = right -->
				<NoctownJoystick
					v-if="shouldShowJoystick"
					:position="layoutSwapped ? 'right' : 'left'"
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
					@trade="handleStartTrade"
				/>

				<!-- FR-070: Trade panel overlay -->
				<!-- 仕様: トレードパネルはオーバーレイ表示、対象プレイヤーがいる場合は新規トレード申請モード -->
				<div v-if="showTradePanel" :class="$style.tradePanelOverlay" @click.self="showTradePanel = false">
					<!-- デバッグ: オーバーレイに状態表示（パネルが消えても見える） -->
					<div :class="$style.tradeDebugInfo">
						showTradePanel: {{ showTradePanel }} |
						activeTradeId: {{ activeTradeId }} |
						tradeTargetPlayer: {{ !!tradeTargetPlayer }}
					</div>
					<!-- 仕様: keyでactiveTradeIdが変更されるたびにコンポーネントを再マウント -->
					<TradePanel
						:key="activeTradeId ?? 'new'"
						ref="tradePanelRef"
						:targetPlayer="tradeTargetPlayer"
						:initialTradeId="activeTradeId"
						@close="handleCloseTradePanel"
						@tradeSent="handleTradeSent"
						@tradeCompleted="handleTradeCompleted"
						@showHistory="handleShowTradeHistory"
						@debugUpdate="tradePanelDebug = $event"
					/>
				</div>

				<!-- T040: Trade window.history overlay -->
				<div v-if="showTradeHistory" :class="$style.tradePanelOverlay" @click.self="showTradeHistory = false">
					<TradeHistory @close="showTradeHistory = false"/>
				</div>

				<!-- T015: 仕様 T010-T011 送信者向け「承認待ち」トースト -->
				<TradePendingToast
					v-if="pendingTradeToast"
					:tradeId="pendingTradeToast.tradeId"
					:targetId="pendingTradeToast.targetId"
					:targetUsername="pendingTradeToast.targetUsername"
					:expiresAt="pendingTradeToast.expiresAt"
					@cancel="handlePendingTradeCancel"
					@expired="handlePendingTradeExpired"
				/>

				<!-- T015: 仕様 T012-T013 受信者向け「承認確認」トースト -->
				<TradeRequestToast
					v-if="incomingTradeToast"
					:tradeId="incomingTradeToast.tradeId"
					:initiatorId="incomingTradeToast.initiatorId"
					:initiatorUsername="incomingTradeToast.initiatorUsername"
					:itemCount="incomingTradeToast.itemCount"
					:currency="incomingTradeToast.currency"
					:tradeMessage="incomingTradeToast.message"
					:expiresAt="incomingTradeToast.expiresAt"
					@accept="handleIncomingTradeAccept"
					@decline="handleIncomingTradeDecline"
					@expired="handleIncomingTradeExpired"
				/>

				<!-- FR-022, FR-023: Pet info floating window -->
				<MkNoctownPetInfoWindow
					v-if="showPetInfoWindow && selectedPetInfo"
					:petId="selectedPetInfo.id"
					:type="selectedPetInfo.type"
					:name="selectedPetInfo.name"
					:ownerName="selectedPetInfo.ownerName ?? null"
					:flavorText="selectedPetInfo.flavorText"
					:hunger="selectedPetInfo.hunger"
					:happiness="selectedPetInfo.happiness"
					@close="handleClosePetInfoWindow"
				/>

				<!-- FR-032: Placed item info floating window -->
				<MkNoctownPlacedItemInfoWindow
					v-if="showPlacedItemInfoWindow && selectedPlacedItem"
					:placedItemId="selectedPlacedItem.id"
					:itemId="selectedPlacedItem.itemId"
					:itemName="selectedPlacedItem.itemName"
					:itemType="selectedPlacedItem.itemType"
					:ownerId="selectedPlacedItem.ownerId"
					:ownerUsername="selectedPlacedItem.ownerUsername"
					:isOwner="isOwnerOfPlacedItem"
					@close="handleClosePlacedItemInfoWindow"
					@pickup="handlePickupPlacedItem"
					@openContainer="handleOpenPlacedContainer"
				/>

				<!-- T009-T011: Emotion buttons with favorite emoji support -->
				<!-- layoutSwapped: false = right (default), true = left -->
				<div :class="[$style.emotionPanel, { [$style.emotionPanelLeft]: layoutSwapped }]">
					<button
						v-for="(item, index) in emotionEmojis"
						:key="index"
						:class="$style.emotionBtn"
						@click="showEmotion(item)"
					>
						<template v-if="item.isCustom && item.url">
							<img :src="item.url" :alt="item.emoji" :class="$style.customEmoji" />
						</template>
						<template v-else>
							{{ item.display }}
						</template>
					</button>
				</div>

				<!-- Settings panel overlay -->
				<div v-if="showSettingsPanel" :class="$style.settingsPanelOverlay" @click="showSettingsPanel = false">
					<div :class="$style.settingsPanel" @click.stop>
						<div :class="$style.settingsHeader">
							<span>Noctown Settings</span>
							<button :class="$style.settingsCloseBtn" @click="showSettingsPanel = false">
								<i class="ti ti-x"></i>
							</button>
						</div>
						<div :class="$style.settingsContent">
							<div :class="$style.settingsItem">
								<div :class="$style.settingsItemLabel">
									<i class="ti ti-arrows-exchange"></i>
									<span>UIレイアウト入れ替え</span>
								</div>
								<div :class="$style.settingsItemDescription">
									ジョイスティックと絵文字ボタンの左右位置を入れ替えます
								</div>
								<label :class="$style.toggle">
									<input v-model="layoutSwapped" type="checkbox" @change="saveLayoutSetting" />
									<span :class="$style.toggleSlider"></span>
								</label>
							</div>
						</div>
					</div>
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

	<!-- 仕様: T021 ワープエフェクト -->
	<MkNoctownWarpEffect
		:active="isWarpEffectActive"
		@animationComplete="onWarpAnimationComplete"
	/>

	<!-- 仕様: T034 賽銭ダイアログ -->
	<MkNoctownSaisenDialog
		v-if="showSaisenDialog"
		@close="closeSaisenDialog"
		@closed="closeSaisenDialog"
		@offer="handleSaisenOffer"
	/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import MkNoctownInventory from '@/components/MkNoctownInventory.vue';
import MkNoctownQuestPanel from '@/components/MkNoctownQuestPanel.vue';
import MkNoctownNpcDialog from '@/components/MkNoctownNpcDialog.vue';
import MkNoctownFarmPanel from '@/components/MkNoctownFarmPanel.vue';
import MkNoctownChatHistoryPanel from '@/components/MkNoctownChatHistoryPanel.vue';
import MkNoctownPlayerInfoWindow from '@/components/MkNoctownPlayerInfoWindow.vue';
import MkNoctownPetInfoWindow from '@/components/MkNoctownPetInfoWindow.vue';
import MkNoctownPlacedItemInfoWindow from '@/components/MkNoctownPlacedItemInfoWindow.vue';
import MkNoctownWarpEffect from '@/components/MkNoctownWarpEffect.vue';
import MkNoctownSaisenDialog from '@/components/MkNoctownSaisenDialog.vue';
import TradePanel from '@/components/noctown/TradePanel.vue';
// T039: トレード履歴コンポーネント
import TradeHistory from '@/components/noctown/TradeHistory.vue';
// T015: 仕様 T010-T013 トースト通知コンポーネント
import TradePendingToast from '@/components/noctown/TradePendingToast.vue';
import TradeRequestToast from '@/components/noctown/TradeRequestToast.vue';
import NoctownJoystick from '@/components/MkNoctown/NoctownJoystick.vue';
import NoctownChatInput from '@/components/MkNoctown/NoctownChatInput.vue';
import { useStream } from '@/stream.js';
import { isMobileDevice, hasPhysicalKeyboard, isForceJoystickEnabled, enableForceJoystick, isDesktopDevice } from '@/scripts/noctown/use-noctown.js';
import { $i } from '@/i.js';
import { apiUrl } from '@@/js/config.js';
import { prefer } from '@/preferences.js';
import { customEmojisMap } from '@/custom-emojis.js';
import type { PlayerData, ChunkData, DroppedItemData, PlacedItemData, NpcData, PetInfo, ChickenData, CowData } from '@/scripts/noctown/engine.js';

// Noctown locale (type-safe access)
const noctownI18n = {
	connected: '接続中',
	loading: 'ゲームを読み込み中...',
	moveHint: 'で移動',
};

// T005: EmotionEmoji type interface for favorite emoji support
interface EmotionEmoji {
	emoji: string; // Original emoji string (Unicode or :custom_name:)
	isCustom: boolean; // Whether this is a custom emoji
	url?: string; // URL for custom emoji image
	display: string; // Display text (Unicode emoji or empty for custom)
}

// T006: Get favorite emojis from Misskey emoji picker settings
function getFavoriteEmojis(): EmotionEmoji[] {
	const palette = prefer.s.emojiPalettes[0]?.emojis ?? [];
	const result: EmotionEmoji[] = [];

	for (const emoji of palette.slice(0, 6)) {
		if (emoji.startsWith(':') && emoji.endsWith(':')) {
			// Custom emoji (e.g., :custom_name:)
			const name = emoji.slice(1, -1);
			const customEmoji = customEmojisMap.get(name);
			result.push({
				emoji,
				isCustom: true,
				url: customEmoji?.url,
				display: '',
			});
		} else {
			// Unicode emoji
			result.push({
				emoji,
				isCustom: false,
				display: emoji,
			});
		}
	}

	// Fill with defaults if fewer than 6 emojis
	const defaults = ['😊', '❗', '❓', '💢', '💕', '👋'];
	while (result.length < 6) {
		result.push({
			emoji: defaults[result.length],
			isCustom: false,
			display: defaults[result.length],
		});
	}

	return result;
}

// T008: emotionEmojis as computed property for reactive updates
const emotionEmojis = computed(() => getFavoriteEmojis());

// FR-032: Check if current player is the owner of selected placed item
const isOwnerOfPlacedItem = computed(() => {
	if (!selectedPlacedItem.value || !playerData.value) return false;
	return selectedPlacedItem.value.ownerId === playerData.value.id;
});

const canvasContainer = ref<HTMLElement | null>(null);
const isConnected = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const playerData = ref<PlayerData | null>(null);
const showInventory = ref(false);
const showQuestPanel = ref(false);
const showNpcDialog = ref(false);
const showFarmPanel = ref(false);
const showChatHistoryPanel = ref(false);
const placeMode = ref(false);
const inventoryRef = ref<{ refresh: () => void } | null>(null);
const questPanelRef = ref<{ refresh: () => void } | null>(null);
const chatHistoryPanelRef = ref<{ refresh: () => void } | null>(null);
const selectedNpc = ref<NpcData | null>(null);
const chatInputFocused = ref(false);
let worldId: string | null = null; // Set from player data

// FR-016: Reload button state
const isReloading = ref(false);
const reloadCooldown = ref(false);

// 仕様: T021-T026 ワープ機能関連
const isWarpEffectActive = ref(false);
const pendingWorldData = ref<{
	worldId: string | null;
	worldType: 'default' | 'shrine';
	spawnPosition: { x: number; y: number; z: number };
	shrineData?: {
		saisenBoxPosition: { x: number; y: number; z: number };
		suzuPosition: { x: number; y: number; z: number };
		returnGatePosition: { x: number; y: number; z: number };
	};
	playersInWorld?: PlayerData[];
	// 仕様: FR-023〜FR-027 ワールド別データ
	placedItems?: PlacedItemData[];
	droppedItems?: DroppedItemData[];
	chickens?: ChickenData[];
	cows?: CowData[];
} | null>(null);

// 仕様: T034 賽銭ダイアログ表示フラグ
const showSaisenDialog = ref(false);

// Selected item for placing
let selectedItemForPlace: { id: string; itemId: string } | null = null;

// Engine and streaming
let engine: import('@/scripts/noctown/engine.js').NoctownEngine | null = null;
let stream: ReturnType<typeof useStream> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connection = ref<any>(null); // Use ref like drawing chat for better reactivity
let moveInterval: ReturnType<typeof window.setInterval> | null = null;
let heartbeatInterval: ReturnType<typeof window.setInterval> | null = null;

// FR-017: Ping/pong for player status mark color
let pingInterval: ReturnType<typeof window.setInterval> | null = null;
let warningCheckInterval: ReturnType<typeof window.setInterval> | null = null;
// Track pending pings: pingId -> { playerId, timeoutId }
const pendingPings = new Map<string, { playerId: string; timeoutId: ReturnType<typeof window.setTimeout> }>();
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
const pendingPlayerInfoPings = new Map<string, { playerId: string; sentTime: number; timeoutId: ReturnType<typeof window.setTimeout> }>();

// FR-022, FR-023: Pet info floating window
const showPetInfoWindow = ref(false);
const selectedPetInfo = ref<PetInfo | null>(null);

// FR-032: Placed item info window state
const showPlacedItemInfoWindow = ref(false);
const selectedPlacedItem = ref<{
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	// 仕様: nullの場合は「不明」として表示
	ownerId: string | null;
	ownerUsername: string | null;
} | null>(null);

// FR-070: Trade panel state
// 仕様: トレードパネルの表示状態とトレード対象プレイヤー情報
const showTradePanel = ref(false);
const tradeTargetPlayer = ref<{
	id: string;
	username: string;
	avatarUrl: string | null;
} | null>(null);
// 仕様: TradePanelへの参照（外部からrefreshTradesを呼び出すため）
const tradePanelRef = ref<InstanceType<typeof TradePanel> | null>(null);
// T040: トレード履歴パネルの表示状態
const showTradeHistory = ref(false);
// 仕様: 承認済みトレードID（交渉モードで直接開く場合に使用）
const activeTradeId = ref<string | null>(null);
// 仕様: TradePanelからのデバッグ情報（パネルが閉じても残る）
const tradePanelDebug = ref<string>('');

// T015: 仕様 T010-T013 トースト通知用の状態
// 送信者向け「承認待ち」トースト
const pendingTradeToast = ref<{
	tradeId: string;
	targetId: string;
	targetUsername: string;
	expiresAt: string;
} | null>(null);
// 受信者向け「承認確認」トースト
const incomingTradeToast = ref<{
	tradeId: string;
	initiatorId: string;
	initiatorUsername: string;
	itemCount: number;
	currency: number;
	message: string | null;
	expiresAt: string;
} | null>(null);

// FR-019: Typing indicator state
let isTyping = false;
let typingDebounceTimeout: ReturnType<typeof window.setTimeout> | null = null;
let typingAutoHideTimeout: ReturnType<typeof window.setTimeout> | null = null;

// Movement state
// T045: Make coordinates reactive for UI display
const currentX = ref(0);
const currentY = ref(0);
const currentZ = ref(0);
let currentRotation = 0;
const moveSpeed = 0.15;

// T027, T028: Mobile/tablet device detection for virtual joystick
// Show joystick on mobile/tablet devices that don't have a physical keyboard
// Also show on tablet-sized windows (1024px or smaller)
const shouldShowJoystick = ref(false);

// Settings panel state
const showSettingsPanel = ref(false);

// Layout setting: swap joystick and emotion panel positions
// false = default (joystick: left, emotion: right)
// true = swapped (joystick: right, emotion: left)
const LAYOUT_STORAGE_KEY = 'noctown:layoutSwapped';
const layoutSwapped = ref(false);

// Load layout setting from localStorage on startup
function loadLayoutSetting(): void {
	try {
		const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
		if (saved !== null) {
			layoutSwapped.value = saved === 'true';
		}
	} catch (e) {
		console.error('Failed to load layout setting:', e);
	}
}

// Save layout setting to localStorage
function saveLayoutSetting(): void {
	try {
		localStorage.setItem(LAYOUT_STORAGE_KEY, String(layoutSwapped.value));
	} catch (e) {
		console.error('Failed to save layout setting:', e);
	}
}

// Toggle settings panel
function toggleSettingsPanel(): void {
	showSettingsPanel.value = !showSettingsPanel.value;
}

// Window resize handler to show/hide joystick based on window size
let resizeHandler: (() => void) | null = null;

// T030: Joystick movement state
let joystickMovement = { x: 0, z: 0 };

// T039: Cache loaded chunks in memory to avoid redundant database queries
const loadedChunks = new Set<string>();
const CHUNK_SIZE = 16;
const CHUNK_LOAD_DISTANCE = 2; // Load chunks 2 chunks ahead

// 仕様: 移動時のアイテムロード用の位置追跡
// プレイヤーが一定距離（ITEM_RELOAD_DISTANCE）移動したらドロップアイテムと設置アイテムを再読み込み
let lastItemLoadX = 0;
let lastItemLoadZ = 0;
const ITEM_RELOAD_DISTANCE = 20; // 20ブロック移動したらアイテムを再読み込み

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

// 仕様: FR-030 インベントリアイテムのインターフェース
interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	imageUrl: string | null;
	// 仕様: FR-030 画像がない場合のUnicode絵文字
	emoji: string | null;
	rarity: number;
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

/**
 * FR-025: Set up touchstart event listener for fallback detection
 * When touchstart is detected on a device not identified as mobile/tablet,
 * force-enable the virtual joystick and persist the setting to localStorage
 */
function setupTouchEventFallback(): void {
	const handleTouchStart = (): void => {
		// FR-025: Touch detected - force enable joystick
		shouldShowJoystick.value = true;
		// FR-025: Persist setting to localStorage for future visits
		enableForceJoystick();
		console.log('FR-025: Touch event detected, force-enabled virtual joystick');
	};

	// Use { once: true } to automatically remove listener after first touch
	// This prevents repeated calls and optimizes performance
	window.document.addEventListener('touchstart', handleTouchStart, { once: true });
}

async function initialize(): Promise<void> {
	try {
		isLoading.value = true;
		error.value = null;

		// Load layout setting from localStorage
		loadLayoutSetting();

		// FR-025: Determine if virtual joystick should be shown
		// Priority order:
		// 0. UserAgent detects desktop PC (Windows/Mac/Linux) → never show (skip all other checks)
		// 1. localStorage has noctown:forceJoystick set to 'true' → show immediately
		// 2. Window width is tablet size or smaller (1024px) → show immediately
		// 3. UserAgent detects mobile/tablet → show immediately
		// 4. Navigator Keyboard API detects no keyboard → show immediately
		// 5. None of the above → wait for touchstart event to show
		const isDesktop = isDesktopDevice();
		if (isDesktop) {
			// Desktop PC detected - don't show joystick
			shouldShowJoystick.value = false;
		} else {
			const forceEnabled = isForceJoystickEnabled();
			const isTabletOrSmallerWindow = window.innerWidth <= 1024;
			if (forceEnabled || isTabletOrSmallerWindow) {
				// FR-025: localStorage flag is set or window is tablet size or smaller, show joystick immediately
				shouldShowJoystick.value = true;
			} else {
				const isMobile = isMobileDevice();
				const hasKeyboard = await hasPhysicalKeyboard();
				shouldShowJoystick.value = isMobile && !hasKeyboard;
			}
		}

		// FR-025: Set up touchstart event listener for fallback detection
		// If joystick is not shown yet, detect touchstart to force-enable joystick
		if (!shouldShowJoystick.value) {
			setupTouchEventFallback();
		}

		// Set up resize handler to show/hide joystick based on window size
		// Note: Desktop PCs don't need joystick even with small windows
		if (!isDesktop) {
			resizeHandler = () => {
				const isTabletOrSmaller = window.innerWidth <= 1024;
				if (isTabletOrSmaller && !shouldShowJoystick.value) {
					shouldShowJoystick.value = true;
				}
				// Note: Don't hide joystick on resize to larger window if it was already shown
				// This prevents jarring UX when user rotates device or adjusts window
			};
			window.addEventListener('resize', resizeHandler);
		}

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
			name: null,
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
		if (canvasContainer.value && playerData.value) {
			const { NoctownEngine } = await import('@/scripts/noctown/engine.js');
			engine = new NoctownEngine(canvasContainer.value);
			engine.createLocalPlayer(playerData.value);

			// 仕様: T022 ワープゲート衝突コールバックを設定
			engine.setWarpCollisionCallback(handleWarpCollision);

			// 仕様: 初期ロード時のワールドタイプを判定
			// worldIdがshrineワールドの場合は神社ワールドとして扱う
			const initialWorldType = worldId === 'shrine-world-001' ? 'shrine' : 'default';

			if (initialWorldType === 'shrine') {
				// 仕様: 神社ワールドで開始した場合は神社オブジェクトを配置
				// WebSocket接続後にworldJoinedイベントで正式にシーンがセットアップされる
				console.log('[Noctown] Initial load in shrine world, skipping default world setup');
			} else {
				// 仕様: T020 初期ワープゲートを配置（デフォルトワールドのみ）
				// warp_gate.html準拠: 白色、スポーン地点から離れた位置
				engine.addWarpGate({
					id: 'warp-gate-to-shrine',
					position: { x: 10, y: 0, z: -15 },
					targetWorldId: 'shrine-world-001',
					color: 0xffffff,
					icon: '⛩️',
				});

				// Load initial chunks around player（デフォルトワールドのみ）
				await loadNearbyChunks(currentX.value, currentZ.value);
				// Load nearby items（デフォルトワールドのみ）
				await loadNearbyItems(currentX.value, currentZ.value);
				// 仕様: 初期ロード位置を記録
				lastItemLoadX = currentX.value;
				lastItemLoadZ = currentZ.value;

				// Load nearby NPCs（デフォルトワールドのみ）
				await loadNearbyNpcs(currentX.value, currentZ.value);

				// FR-022: Load nearby pets（デフォルトワールドのみ）
				await loadNearbyPets(currentX.value, currentZ.value);
			}
		}

		// Connect to WebSocket
		await connectStream();

		// Add keyboard shortcuts
		window.addEventListener('keydown', handleKeyDown);

		// FR-018: Add canvas click listener for player info window
		// Note: 'click' event is sufficient for both mouse and touch devices
		// Mobile browsers synthesize 'click' events after 'touchend'
		if (engine) {
			const rendererElement = engine.getRendererDomElement();
			rendererElement.addEventListener('click', handleCanvasClick);
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
	// 仕様: itemDroppedイベント - 自分がドロップしたアイテムはローカルで追加済みなのでスキップ
	connection.value.on('itemDropped', (body: { playerId: string; droppedItemId: string; itemId: string; itemName: string; itemType: string; emoji: string | null; imageUrl: string | null; quantity: number; positionX: number; positionY: number; positionZ: number }) => {
		if (!engine) return;
		// 自分がドロップしたアイテムはローカルで追加済み
		const localPlayerId = engine.getLocalPlayerId();
		if (localPlayerId && body.playerId === localPlayerId) return;
		// 他プレイヤーがドロップしたアイテムを追加
		engine.addDroppedItem({
			id: body.droppedItemId,
			itemId: body.itemId,
			itemName: body.itemName,
			itemType: body.itemType,
			emoji: body.emoji,
			imageUrl: body.imageUrl,
			rarity: 0,
			quantity: body.quantity,
			positionX: body.positionX,
			positionY: body.positionY,
			positionZ: body.positionZ,
		});
	});
	connection.value.on('itemPicked', (body: { droppedItemId: string }) => {
		if (engine) engine.removeDroppedItem(body.droppedItemId);
	});
	// 仕様: FR-032 設置アイテムのリアルタイム同期
	// 他プレイヤーがアイテムを設置した際にマップに追加
	connection.value.on('itemPlaced', (body: {
		playerId: string;
		placedItemId: string;
		itemId: string;
		itemName: string;
		itemType: string;
		ownerUsername: string | null;
		x: number;
		y: number;
		z: number;
		rotation: number;
		worldId: string | null;
	}) => {
		if (!engine) return;
		// 自分が設置したアイテムはローカルで処理済み（APIレスポンス後にリロード）
		const localPlayerId = engine.getLocalPlayerId();
		if (localPlayerId && body.playerId === localPlayerId) return;
		// 現在のワールドと異なる設置アイテムはスキップ
		const currentWorldId = worldId ?? null;
		if (body.worldId !== currentWorldId) return;
		// 他プレイヤーが設置したアイテムを追加
		engine.addPlacedItem({
			id: body.placedItemId,
			itemId: body.itemId,
			itemName: body.itemName,
			itemType: body.itemType,
			ownerId: body.playerId,
			ownerUsername: body.ownerUsername,
			positionX: body.x,
			positionY: body.y,
			positionZ: body.z,
			rotation: body.rotation,
		});
	});
	// 仕様FR-123〜FR-126: 他プレイヤーが宝箱を開封した際のイベント
	connection.value.on('containerOpened', (body: {
		placedItemId: string;
		openedByPlayerId: string;
		positionX: number;
		positionY: number;
		positionZ: number;
	}) => {
		handleContainerOpened(body);
	});
	// T017: Updated to receive isCustomEmoji flag from server
	connection.value.on('playerEmotion', (body: { playerId: string; emoji: string; isCustomEmoji?: boolean }) => {
		handlePlayerEmoted(body);
	});
	// FR-029: playerChattedイベントに位置情報とmessageIdが含まれる
	connection.value.on('playerChatted', (body: {
		playerId: string;
		message: string;
		messageId?: string;
		positionX?: number;
		positionZ?: number;
	}) => {
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

	// 仕様: トレードリクエスト受信イベント（受信者向けトースト表示）
	connection.value.on('tradeRequest', (body: unknown) => {
		handleTradeRequest(body);
	});

	// T015: 仕様 T009-T011 トレードリクエスト送信確認イベント（送信者向けトースト表示）
	connection.value.on('tradeRequestSent', (body: {
		tradeId: string;
		targetId: string;
		targetUsername: string;
		status: string;
		expiresAt: string;
	}) => {
		handleTradeRequestSent(body);
	});

	// 仕様: トレード承認イベント - 両者に直接バーターモードでパネルを開く
	console.log('[Noctown Trade] Registering tradeAccepted event listener');
	connection.value.on('tradeAccepted', (body: {
		tradeId: string;
		initiatorId: string;
		targetId: string;
		initiatorUsername: string;
		targetUsername: string;
		initiatorAvatarUrl: string | null;
		targetAvatarUrl: string | null;
	}) => {
		console.log('[Noctown Trade] tradeAccepted event fired:', body);
		handleTradeAccepted(body);
	});

	// T017: トレード拒否イベント（送信者に「拒否されました」通知）
	connection.value.on('tradeDeclined', (body: {
		tradeId: string;
		targetId: string;
		targetUsername: string;
	}) => {
		handleTradeDeclined(body);
	});

	// T021: トレードアイテム変更イベント（リアルタイム同期）
	connection.value.on('tradeItemsChanged', (body: {
		tradeId: string;
		items: Array<{ itemId: string; itemName: string; quantity: number }>;
		currency: number;
		isFromInitiator: boolean;
	}) => {
		handleTradeItemsChanged(body);
	});

	// T025: トレード確認イベント（相手が「交換OK」を押した）
	connection.value.on('tradeConfirmed', (body: {
		tradeId: string;
		confirmedBy: 'initiator' | 'target';
	}) => {
		handleTradeConfirmed(body);
	});

	// T027: トレード確認リセットイベント（アイテム変更で確認がリセットされた）
	connection.value.on('tradeConfirmReset', (body: {
		tradeId: string;
		resetBy: string;
	}) => {
		handleTradeConfirmReset(body);
	});

	// T033: トレードキャンセルイベント（相手がキャンセルした）
	connection.value.on('tradeCancelled', (body: {
		tradeId: string;
		cancelledBy: string;
		reason: 'user_cancelled' | 'disconnected' | 'expired';
	}) => {
		handleTradeCancelled(body);
	});

	// tradeCompletedイベント（トレードが完了した）
	connection.value.on('tradeCompleted', (body: {
		tradeId: string;
	}) => {
		handleTradeCompletedEvent(body);
	});

	// 仕様: T023 神社ワールド - ワープ関連イベント
	connection.value.on('warpStarted', () => {
		handleWarpStarted();
	});
	connection.value.on('worldJoined', (body: {
		worldId: string | null;
		worldType: 'default' | 'shrine';
		worldDisplayName: string | null;
		spawnPosition: { x: number; y: number; z: number };
		playersInWorld: PlayerData[];
		// 仕様: FR-023〜FR-027 ワールド別データ
		placedItems?: PlacedItemData[];
		droppedItems?: DroppedItemData[];
		chickens?: ChickenData[];
		cows?: CowData[];
		shrineData?: {
			saisenBoxPosition: { x: number; y: number; z: number };
			suzuPosition: { x: number; y: number; z: number };
			returnGatePosition: { x: number; y: number; z: number };
		};
		isReconnect?: boolean;
	}) => {
		handleWorldJoined(body);
	});
	connection.value.on('warpFailed', (body: { code: string; message: string }) => {
		handleWarpFailed(body);
	});
	// T025: 他プレイヤーのワープイベント
	connection.value.on('playerWarped', (body: {
		playerId: string;
		direction: 'left' | 'joined';
		toWorldId?: string | null;
		fromWorldId?: string | null;
		playerData?: PlayerData;
	}) => {
		handlePlayerWarped(body);
	});
	// T037: 鈴アニメーションイベント
	connection.value.on('bellRing', () => {
		handleBellRing();
	});
	// T036: 賽銭完了イベント
	connection.value.on('saisenCompleted', (body: {
		amount: number;
		totalSaisen: number;
		mochiAwarded: number;
		newBalance: number;
		isFirstOffer: boolean;
	}) => {
		handleSaisenCompleted(body);
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

/**
 * 仕様: WebSocketでplayerMovedイベントを受信した際の処理
 * 修正: 自プレイヤーの判定を強化し、デバッグログを追加
 * 修正日: 2025-12-14
 */
function handlePlayerMoved(data: PlayerData): void {
	// デバッグログ: playerMovedイベントの受信内容を確認
	console.log('[handlePlayerMoved] Received playerMoved event:', {
		receivedId: data.id,
		localPlayerId: playerData.value?.id,
		isLocalPlayer: data.id === playerData.value?.id,
		username: data.username,
		position: { x: data.positionX, y: data.positionY, z: data.positionZ },
		rotation: data.rotation,
	});

	if (!engine) {
		console.warn('[handlePlayerMoved] Engine not initialized');
		return;
	}

	// 自プレイヤーの場合はスキップ
	if (data.id === playerData.value?.id) {
		console.log('[handlePlayerMoved] Skipping local player update');
		return;
	}

	engine.updateRemotePlayer(data);
}

// FR-007-6: プレイヤー参加時は常に新規追加（オフライン時は既に削除されているため）
// 仕様: T084 ワールドIDでフィルタリング - 同じワールドのプレイヤーのみ表示
function handlePlayerJoined(data: PlayerData & { currentWorldId?: string | null }): void {
	if (!engine || data.id === playerData.value?.id) return;
	// ワールドIDが異なるプレイヤーは追加しない
	const playerWorldId = data.currentWorldId ?? null;
	if (playerWorldId !== worldId) {
		console.log('[Noctown] Skipping player from different world:', data.id, 'playerWorld:', playerWorldId, 'myWorld:', worldId);
		return;
	}
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
	// 仕様: 神社ワールドではチャンクイベントを無視（専用オブジェクトのみ使用）
	if (engine?.getCurrentWorldType() === 'shrine' || worldId === 'shrine-world-001') {
		console.log('[Noctown] handleChunkGenerated: skipping chunk in shrine world');
		return;
	}

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

	// FR-074: VIEW_DISTANCE management (remove chunks outside view distance)
	// 修正: VIEW_DISTANCEをCHUNK_LOAD_DISTANCE(=2)より1大きくしてマージンを確保
	// これにより、チャンク境界付近でのエンティティ消失を防ぐ
	const VIEW_DISTANCE = 3;
	const playerChunkX = Math.floor(currentX.value / CHUNK_SIZE);
	const playerChunkZ = Math.floor(currentZ.value / CHUNK_SIZE);

	// Remove chunks outside VIEW_DISTANCE
	// 修正: イテレーション中の削除を避けるため、削除対象を先に収集
	const chunksToRemove: string[] = [];
	for (const chunkKey of loadedChunks) {
		const [cx, cz] = chunkKey.split(',').map(Number);
		const dx = Math.abs(cx - playerChunkX);
		const dz = Math.abs(cz - playerChunkZ);

		if (dx > VIEW_DISTANCE || dz > VIEW_DISTANCE) {
			chunksToRemove.push(chunkKey);
		}
	}

	// 収集した削除対象を一括削除
	for (const chunkKey of chunksToRemove) {
		const [cx, cz] = chunkKey.split(',').map(Number);
		engine.removeChunk(cx, cz);
		loadedChunks.delete(chunkKey);
	}
}

// T017-T018: handlePlayerEmoted updated for custom emoji support
function handlePlayerEmoted(data: { playerId: string; emoji: string; isCustomEmoji?: boolean }): void {
	if (!engine) return;

	if (data.isCustomEmoji) {
		// T018: Resolve custom emoji URL from customEmojisMap
		const name = data.emoji.slice(1, -1); // Remove : from :emoji_name:
		const customEmoji = customEmojisMap.get(name);
		engine.showRemotePlayerEmote(data.playerId, data.emoji, true, customEmoji?.url);
	} else {
		engine.showRemotePlayerEmote(data.playerId, data.emoji, false);
	}
}

// FR-029: チャット履歴記録用の距離閾値（20ブロック）
const CHAT_HISTORY_DISTANCE_THRESHOLD = 20;

// FR-029: チャット受信時に距離判定を行い、受信記録をサーバーに送信
function handlePlayerChatted(data: {
	playerId: string;
	message: string;
	messageId?: string;
	positionX?: number;
	positionZ?: number;
}): void {
	if (!engine) return;
	engine.showRemotePlayerChat(data.playerId, data.message);

	// FR-029: messageIdがない場合は記録しない（旧バージョン互換）
	if (!data.messageId) return;

	// 自分自身のメッセージはバックエンドで自動登録されるためスキップ
	if (playerData.value && data.playerId === playerData.value.id) return;

	// 位置情報がない場合は記録しない
	if (data.positionX === undefined || data.positionZ === undefined) return;

	// 距離を計算（XZ平面での距離）
	const dx = data.positionX - currentX.value;
	const dz = data.positionZ - currentZ.value;
	const distance = Math.sqrt(dx * dx + dz * dz);

	console.debug('[Noctown Chat] Distance check:', {
		senderPos: { x: data.positionX, z: data.positionZ },
		myPos: { x: currentX.value, z: currentZ.value },
		distance: distance.toFixed(2),
		threshold: CHAT_HISTORY_DISTANCE_THRESHOLD,
	});

	// 50ブロック以内の場合のみサーバーに受信記録を送信
	if (distance <= CHAT_HISTORY_DISTANCE_THRESHOLD) {
		recordChatReceipt(data.messageId);
	}
}

// FR-029: チャット受信記録をサーバーに送信
async function recordChatReceipt(messageId: string): Promise<void> {
	try {
		const token = getToken();
		if (!token) return;

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
			console.warn('[Noctown Chat] Failed to record chat receipt:', response.status);
		}
	} catch (e) {
		console.warn('[Noctown Chat] Error recording chat receipt:', e);
	}
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
		window.clearTimeout(typingDebounceTimeout);
		typingDebounceTimeout = null;
	}
	if (typingAutoHideTimeout) {
		window.clearTimeout(typingAutoHideTimeout);
		typingAutoHideTimeout = null;
	}

	// Show chat on local player
	engine.showLocalPlayerChat(message);

	// Send chat event to server via WebSocket
	// FR-029: チャット送信時に現在の位置情報も送信（距離判定の精度向上）
	connection.value.send('chat', {
		message,
		positionX: currentX.value,
		positionZ: currentZ.value,
	});
}

// FR-019: Handle chat input changes for typing indicator
function handleChatInput(hasText: boolean): void {
	if (!connection.value || !engine) return;

	// Clear existing timeouts
	if (typingDebounceTimeout) {
		window.clearTimeout(typingDebounceTimeout);
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
			window.clearTimeout(typingAutoHideTimeout);
		}
		typingAutoHideTimeout = window.setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				connection.value?.send('typingEnd', {});
				engine?.showLocalPlayerTyping(false);
			}
			typingAutoHideTimeout = null;
		}, 3000);
	} else {
		// User cleared input - debounce typingEnd by 500ms
		typingDebounceTimeout = window.setTimeout(() => {
			if (isTyping) {
				isTyping = false;
				connection.value?.send('typingEnd', {});
				engine?.showLocalPlayerTyping(false);
			}
			if (typingAutoHideTimeout) {
				window.clearTimeout(typingAutoHideTimeout);
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
		console.error('Failed to window.fetch nearby players:', e);
	}
}

// T036-T037: Load nearby chunks using WebSocket chunk generation
async function loadNearbyChunks(x: number, z: number): Promise<void> {
	// 仕様: 神社ワールドではチャンクロードをスキップ（専用オブジェクトのみ使用）
	// engineのworldTypeまたはworldIdで判定
	if (engine?.getCurrentWorldType() === 'shrine' || worldId === 'shrine-world-001') {
		return;
	}

	// 仕様: デフォルトワールドではworldIdがnull
	// connection と isConnected のみチェック（worldId は null 許容）
	if (!connection.value || !isConnected.value) {
		console.warn('[Noctown] loadNearbyChunks: precondition failed', {
			hasConnection: !!connection.value,
			isConnected: isConnected.value,
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

	/**
	 * 仕様: プレイヤー移動ループ（60fps）
	 * - キーボード入力とジョイスティック入力を統合
	 * - 移動がある場合のみ位置を更新してサーバーに送信（100ms間隔でスロットル）
	 * - 移動がない場合はチャンクロードのみ実行（1秒間隔）
	 * 修正日: 2025-12-14
	 * 修正内容: プレイヤーが移動していない場合は位置送信をスキップ
	 */
	moveInterval = window.setInterval(() => {
		if (!engine || !isConnected.value) return;

		// T030: Combine keyboard and joystick input
		const keyboardInput = engine.getMovementInput();

		// Merge keyboard and joystick inputs
		let finalInput = { x: 0, z: 0, rotation: currentRotation };
		let hasJoystickInput = false;
		let isMoving = false;

		if (joystickMovement.x !== 0 || joystickMovement.z !== 0) {
			// Use joystick input (mobile)
			finalInput.x = joystickMovement.x;
			finalInput.z = joystickMovement.z;
			hasJoystickInput = true;
			isMoving = true;
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
			isMoving = true;
			// Keyboard input is already tracked by engine.ts via keys Set
		}

		// 移動がない場合はチャンクロードのみ実行してreturn
		if (!isMoving) {
			const now = Date.now();
			if (now - lastChunkCheckTime >= chunkCheckInterval) {
				loadNearbyChunks(currentX.value, currentZ.value);
				lastChunkCheckTime = now;
			}
			return;
		}

		// 移動がある場合のみ以下を実行

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

			// 仕様: プレイヤーが一定距離移動したらドロップアイテムと設置アイテムを再読み込み
			// 新しいチャンクに入った時にアイテムが表示されない問題を解決
			const dx = currentX.value - lastItemLoadX;
			const dz = currentZ.value - lastItemLoadZ;
			const distanceFromLastLoad = Math.sqrt(dx * dx + dz * dz);
			if (distanceFromLastLoad >= ITEM_RELOAD_DISTANCE) {
				loadNearbyItems(currentX.value, currentZ.value);
				lastItemLoadX = currentX.value;
				lastItemLoadZ = currentZ.value;
			}
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
	heartbeatInterval = window.setInterval(() => {
		if (!connection.value || !isConnected.value) return;
		connection.value.send('heartbeat', {});
	}, 30000); // Every 30 seconds
}

// FR-017: Start ping/pong interval for player status mark color
function startPingPong(): void {
	pingInterval = window.setInterval(() => {
		if (!connection.value || !isConnected.value || !engine) return;

		// Get all remote player IDs from engine
		const remotePlayerIds = engine.getRemotePlayerIds();

		for (const playerId of remotePlayerIds) {
			// 各プレイヤーごとに一意のpingIdを生成
			const pingId = `${Date.now()}-${playerId}-${Math.random().toString(36).substr(2, 9)}`;

			// タイムアウト設定
			const timeoutId = window.setTimeout(() => {
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
	}, 30000); // Every 30 seconds
}

// FR-017: Handle pong response and update player mark color
function handlePongReceived(data: { responderPlayerId: string; pingId: string }): void {
	if (!engine) return;

	const pendingPing = pendingPings.get(data.pingId);
	if (pendingPing) {
		// タイムアウトをクリア
		window.clearTimeout(pendingPing.timeoutId);
		pendingPings.delete(data.pingId);

		// Update player mark color (pongが返ってきたので正常)
		engine.updateRemotePlayerPingStatus(data.responderPlayerId, 0);
	}

	// FR-018: Check if this pong is for player info window
	for (const [pingId, pending] of pendingPlayerInfoPings) {
		if (pending.playerId === data.responderPlayerId) {
			window.clearTimeout(pending.timeoutId);
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

// FR-018, FR-022: Handle canvas click/touch for player/pet info window
function handleCanvasClick(event: MouseEvent | TouchEvent): void {
	if (!engine) return;

	// 仕様: FR-032 設置モード中はアイテム設置を実行
	if (placeMode.value) {
		onPlaceClick();
		return;
	}

	// FR-022: Check if clicked/touched on a pet first
	const petInfo = engine.getClickedPet(event);
	if (petInfo) {
		// Prevent default to avoid click event firing after touchend
		event.preventDefault();
		openPetInfoWindow(petInfo);
		return;
	}

	// FR-032: Check if clicked/touched on a dropped item (pickup on click)
	const droppedItem = engine.getClickedDroppedItem(event);
	if (droppedItem) {
		event.preventDefault();
		handlePickupDroppedItem(droppedItem);
		return;
	}

	// FR-032: Check if clicked/touched on a placed item
	const placedItem = engine.getClickedPlacedItem(event);
	if (placedItem) {
		event.preventDefault();
		openPlacedItemInfoWindow(placedItem);
		return;
	}

	// 仕様: T035 神社オブジェクトのクリック処理（賽銭箱・鈴）
	const shrineObject = engine.getClickedShrineObject(event);
	if (shrineObject) {
		event.preventDefault();
		if (shrineObject === 'saisenBox') {
			openSaisenDialog();
		} else if (shrineObject === 'suzu') {
			handleSuzuClick();
		}
		return;
	}

	// FR-018: Check if clicked/touched on a remote player
	const playerId = engine.getClickedPlayerId(event);
	if (playerId) {
		// Prevent default to avoid click event firing after touchend
		event.preventDefault();
		openPlayerInfoWindow(playerId);
	}
}

// FR-022: Open pet info window
function openPetInfoWindow(pet: PetInfo): void {
	selectedPetInfo.value = pet;
	showPetInfoWindow.value = true;
}

// FR-018: Open player info window
function openPlayerInfoWindow(playerId: string): void {
	if (!engine) return;

	const playerData = engine.getRemotePlayerData(playerId);
	if (!playerData) return;

	selectedPlayerInfo.value = {
		playerId: playerData.id,
		name: playerData.name,
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

	const timeoutId = window.setTimeout(() => {
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

// FR-022, FR-023: Close pet info window
function handleClosePetInfoWindow(): void {
	showPetInfoWindow.value = false;
	selectedPetInfo.value = null;
}

// FR-032: Open placed item info window
// 仕様: ownerIdがnullの場合は「不明」として表示
function openPlacedItemInfoWindow(item: { id: string; itemId: string; itemName: string; itemType: string; ownerId: string | null; ownerUsername: string | null }): void {
	selectedPlacedItem.value = item;
	showPlacedItemInfoWindow.value = true;
}

// FR-032: Close placed item info window
function handleClosePlacedItemInfoWindow(): void {
	showPlacedItemInfoWindow.value = false;
	selectedPlacedItem.value = null;
}

// FR-032: Handle pickup placed item
async function handlePickupPlacedItem(placedItemId: string): Promise<void> {
	if (!engine) return;

	try {
		await noctownApi('noctown/item/pickup-placed', {
			placedItemId,
		});

		// Remove from 3D scene
		engine.removePlacedItemById(placedItemId);

		// Close info window
		handleClosePlacedItemInfoWindow();

		// Refresh inventory if open
		inventoryRef.value?.refresh();
	} catch (e) {
		console.error('Failed to pickup placed item:', e);
	}
}

// 仕様: 設置された宝箱（コンテナ）を開ける
async function handleOpenPlacedContainer(placedItemId: string): Promise<void> {
	if (!engine) return;

	try {
		const result = await noctownApi<{
			success: boolean;
			obtainedItems: Array<{
				itemId: string;
				itemName: string;
				quantity: number;
				rarity: number;
				emoji: string | null;
			}>;
		}>('noctown/container/open-placed', {
			placedItemId,
		});

		if (result.success) {
			// 仕様: 情報ウィンドウを先に閉じる（アニメーションを見せるため）
			handleClosePlacedItemInfoWindow();

			// 仕様: 宝箱開封アニメーションを実行（蓋が開き、パーティクルが出現）
			await engine.openTreasureChestWithAnimation(placedItemId);

			// 仕様: インベントリを更新
			inventoryRef.value?.refresh();

			// 仕様FR-119: 獲得アイテム一覧をトースト通知で表示
			if (result.obtainedItems && result.obtainedItems.length > 0) {
				const itemNames = result.obtainedItems.map(item =>
					`${item.emoji ?? ''} ${item.itemName} x${item.quantity}`,
				).join(', ');
				os.alert({
					type: 'success',
					title: '宝箱を開封しました',
					text: `${itemNames} を獲得しました`,
				});
			}
		}
	} catch (e) {
		console.error('Failed to open placed container:', e);
	}
}

// 仕様FR-123〜FR-126: 他プレイヤーが宝箱を開封した際のハンドラー
async function handleContainerOpened(body: {
	placedItemId: string;
	openedByPlayerId: string;
	positionX: number;
	positionY: number;
	positionZ: number;
}): Promise<void> {
	if (!engine) return;

	// 仕様FR-126: 自分が開封した場合は無視（既にローカルでアニメーション再生済み）
	const localPlayerId = engine.getLocalPlayerId();
	if (localPlayerId === body.openedByPlayerId) {
		return;
	}

	// 仕様FR-125: 該当の宝箱で開封アニメーションを再生し、完了後に削除
	await engine.openTreasureChestWithAnimation(body.placedItemId);
}

// FR-032: Handle click pickup of dropped item
async function handlePickupDroppedItem(item: { id: string; itemName: string }): Promise<void> {
	if (!engine) return;

	try {
		const result = await noctownApi<{ success: boolean }>('noctown/item/pickup', {
			droppedItemId: item.id,
		});

		if (result.success) {
			// 仕様: 拾得成功時にエンジンからドロップアイテムを削除
			engine.removeDroppedItem(item.id);
			// インベントリを更新
			if (inventoryRef.value) {
				inventoryRef.value.refresh();
			}
		}
	} catch (error) {
		console.error('Failed to pick up dropped item:', error);
	}
}

// FR-018: Handle manual ping from player info window
function handleManualPing(): void {
	if (selectedPlayerInfo.value) {
		sendPlayerInfoPing(selectedPlayerInfo.value.playerId);
	}
}

// FR-070: Start trade with a player
// 仕様: プレイヤー情報ウィンドウからトレードボタンを押すとトレードリクエストを送信
// トレードパネルは開かない。相手が承認したらtradeAcceptedイベントで両者にパネルが開く
async function handleStartTrade(playerId: string): Promise<void> {
	if (!engine) return;

	const playerData = engine.getRemotePlayerData(playerId);
	if (!playerData) return;

	try {
		// トレードリクエストを送信（アイテムなし、承認後に交渉開始）
		await os.apiWithDialog('noctown/trade/request', {
			targetPlayerId: playerId,
		});
		// tradeRequestSentイベントがバックエンドから来るので、そこでpendingTradeToastが表示される
		// プレイヤー情報ウィンドウを閉じる
		selectedPlayerInfo.value = null;
	} catch (err) {
		console.error('[Noctown Trade] Failed to send trade request:', err);
	}
}

// FR-070: Close trade panel
// 仕様: パネルを閉じるときはすべての状態をリセット
function handleCloseTradePanel(): void {
	showTradePanel.value = false;
	tradeTargetPlayer.value = null;
	activeTradeId.value = null;
}

// T040: Show trade window.history panel
function handleShowTradeHistory(): void {
	showTradePanel.value = false;
	activeTradeId.value = null;
	showTradeHistory.value = true;
}

// FR-070: Handle trade request sent
// 仕様: トレードリクエスト送信後の処理（TradePanel内での送信時）
function handleTradeSent(): void {
	console.log('Trade request sent');
	// パネルを閉じる（tradeRequestSentイベントでトーストが表示される）
	showTradePanel.value = false;
	tradeTargetPlayer.value = null;
	activeTradeId.value = null;
}

// FR-070: Handle trade completed
// 仕様: トレード完了後の処理（インベントリ更新など）
function handleTradeCompleted(): void {
	console.log('Trade completed');
	showTradePanel.value = false;
	tradeTargetPlayer.value = null;
	activeTradeId.value = null;
	// TODO: インベントリの更新通知
}

// T015: 仕様 T012-T013 トレードリクエスト受信時の処理（受信者向けトースト表示）
function handleTradeRequest(data: unknown): void {
	console.log('[Noctown Trade] Received trade request:', data);

	// トレードパネルが開いている場合は自動更新
	if (tradePanelRef.value && showTradePanel.value) {
		tradePanelRef.value.refreshTrades();
	}

	// T015: トーストで受信者向け承認確認UIを表示
	const typedData = data as {
		tradeId: string;
		initiatorId: string;
		initiatorUserId: string;
		offeredItems?: Array<{ itemId: string; quantity: number }>;
		offeredCurrency?: number;
		message?: string | null;
		expiresAt: string;
	};
	const itemCount = typedData.offeredItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	incomingTradeToast.value = {
		tradeId: typedData.tradeId,
		initiatorId: typedData.initiatorId,
		initiatorUsername: typedData.initiatorUserId, // TODO: ユーザー名を取得する処理を追加
		itemCount: itemCount,
		currency: typedData.offeredCurrency ?? 0,
		message: typedData.message ?? null,
		expiresAt: typedData.expiresAt,
	};
}

// T015: 仕様 T009-T011 トレードリクエスト送信確認イベント（送信者向けトースト表示）
function handleTradeRequestSent(data: {
	tradeId: string;
	targetId: string;
	targetUsername: string;
	status: string;
	expiresAt: string;
}): void {
	console.log('[Noctown Trade] Trade request sent:', data);

	// 送信者向け「承認待ち」トーストを表示
	pendingTradeToast.value = {
		tradeId: data.tradeId,
		targetId: data.targetId,
		targetUsername: data.targetUsername,
		expiresAt: data.expiresAt,
	};
}

// T015: 仕様 T010-T011 送信者向けトーストのイベントハンドラー
async function handlePendingTradeCancel(tradeId: string): Promise<void> {
	console.log('[Noctown Trade] Cancelling pending trade:', tradeId);
	try {
		await os.apiWithDialog('noctown/trade/cancel', { tradeId });
		pendingTradeToast.value = null;
	} catch (err) {
		console.error('[Noctown Trade] Failed to cancel trade:', err);
	}
}

function handlePendingTradeExpired(): void {
	console.log('[Noctown Trade] Pending trade expired');
	pendingTradeToast.value = null;
}

// 仕様: トレードAPIエラーコードとメッセージのマッピング
const tradeErrorMessages: Record<string, string> = {
	TRADE_NOT_FOUND: 'トレードが見つからないか、既に処理済みです',
	TRADE_EXPIRED: 'トレードの有効期限が切れました',
	TRADE_FAILED: 'トレードの処理に失敗しました',
	PLAYER_NOT_FOUND: 'プレイヤーが見つかりません',
};

// 仕様: 受信者向けトーストの承認ボタンハンドラー
// APIを呼び出すとバックエンドがtradeAcceptedイベントを両者に送信するため、
// ここではトーストを閉じるのみ。パネル表示はイベントハンドラーで行う。
async function handleIncomingTradeAccept(tradeId: string): Promise<void> {
	console.log('[Noctown Trade] Accepting trade:', tradeId);
	try {
		// 仕様: os.apiWithDialogではなくmisskeyApiを使用（ダイアログによるUI干渉を防止）
		await misskeyApi('noctown/trade/respond', { tradeId, response: 'accept' });
		console.log('[Noctown Trade] Trade accept API success');
		// tradeAcceptedイベントがバックエンドから来るので、トーストはイベントハンドラーで閉じる
		// ここでは念のため閉じておく
		incomingTradeToast.value = null;
	} catch (err: unknown) {
		console.error('[Noctown Trade] Failed to accept trade:', err);
		// エラー時はユーザーに通知（エラーコードに応じたメッセージを表示）
		const errorCode = (err as { code?: string })?.code;
		const message = errorCode && tradeErrorMessages[errorCode]
			? tradeErrorMessages[errorCode]
			: 'トレードの承認に失敗しました';
		os.alert({
			type: 'error',
			title: 'トレードエラー',
			text: message,
		});
		// エラー時はトーストを閉じる
		incomingTradeToast.value = null;
	}
}

async function handleIncomingTradeDecline(tradeId: string): Promise<void> {
	console.log('[Noctown Trade] Declining trade:', tradeId);
	try {
		// 仕様: os.apiWithDialogではなくmisskeyApiを使用（ダイアログによるUI干渉を防止）
		await misskeyApi('noctown/trade/respond', { tradeId, response: 'decline' });
		console.log('[Noctown Trade] Trade decline API success');
		incomingTradeToast.value = null;
	} catch (err: unknown) {
		console.error('[Noctown Trade] Failed to decline trade:', err);
		const errorCode = (err as { code?: string })?.code;
		const message = errorCode && tradeErrorMessages[errorCode]
			? tradeErrorMessages[errorCode]
			: 'トレードの拒否に失敗しました';
		os.alert({
			type: 'error',
			title: 'トレードエラー',
			text: message,
		});
		incomingTradeToast.value = null;
	}
}

function handleIncomingTradeExpired(): void {
	console.log('[Noctown Trade] Incoming trade request expired');
	incomingTradeToast.value = null;
}

// 仕様: トレード承認イベントハンドラー - 両者に直接バーターモードでパネルを開く
// リストモードは不要、承認時に即座に交渉画面を表示
function handleTradeAccepted(data: {
	tradeId: string;
	initiatorId: string;
	targetId: string;
	initiatorUsername: string;
	targetUsername: string;
	initiatorAvatarUrl: string | null;
	targetAvatarUrl: string | null;
}): void {
	console.log('[Noctown Trade] Trade accepted event received:', data);
	console.log('[Noctown Trade] Current state:', {
		pendingTradeToast: pendingTradeToast.value,
		incomingTradeToast: incomingTradeToast.value,
		showTradePanel: showTradePanel.value,
		activeTradeId: activeTradeId.value,
	});

	// 承認待ちトーストを閉じる（送信者の場合）
	if (pendingTradeToast.value?.tradeId === data.tradeId) {
		console.log('[Noctown Trade] Closing pending trade toast');
		pendingTradeToast.value = null;
	}

	// 受信者トーストを閉じる（受信者の場合）
	if (incomingTradeToast.value?.tradeId === data.tradeId) {
		console.log('[Noctown Trade] Closing incoming trade toast');
		incomingTradeToast.value = null;
	}

	// 仕様: トレードIDを設定してバーターモードでパネルを開く
	// targetPlayerはnull、initialTradeIdでTradePanelが交渉モードで開く
	console.log('[Noctown Trade] Opening trade panel with tradeId:', data.tradeId);
	activeTradeId.value = data.tradeId;
	tradeTargetPlayer.value = null;
	showTradePanel.value = true;
	console.log('[Noctown Trade] Trade panel state after update:', {
		showTradePanel: showTradePanel.value,
		activeTradeId: activeTradeId.value,
		tradeTargetPlayer: tradeTargetPlayer.value,
	});
}

// T017: トレード拒否イベントハンドラー（送信者に通知）
function handleTradeDeclined(data: {
	tradeId: string;
	targetId: string;
	targetUsername: string;
}): void {
	console.log('[Noctown Trade] Trade declined:', data);

	// 承認待ちトーストを閉じる
	if (pendingTradeToast.value?.tradeId === data.tradeId) {
		pendingTradeToast.value = null;
	}

	// 拒否通知を表示
	os.alert({
		type: 'warning',
		title: 'トレードが拒否されました',
		text: `${data.targetUsername} さんがトレードを拒否しました。`,
	});
}

// T021: トレードアイテム変更イベントハンドラー
function handleTradeItemsChanged(data: {
	tradeId: string;
	items: Array<{ itemId: string; itemName: string; quantity: number }>;
	currency: number;
	isFromInitiator: boolean;
}): void {
	console.log('[Noctown Trade] Trade items changed:', data);

	// トレードパネルが開いている場合は更新
	if (tradePanelRef.value && showTradePanel.value) {
		tradePanelRef.value.refreshTrades();
	}
}

// T025: トレード確認イベントハンドラー（相手が「交換OK」を押した）
function handleTradeConfirmed(data: {
	tradeId: string;
	confirmedBy: 'initiator' | 'target';
}): void {
	console.log('[Noctown Trade] Trade confirmed by:', data.confirmedBy);

	// トレードパネルが開いている場合は更新
	if (tradePanelRef.value && showTradePanel.value) {
		tradePanelRef.value.refreshTrades();
	}
}

// T027: トレード確認リセットイベントハンドラー
function handleTradeConfirmReset(data: {
	tradeId: string;
	resetBy: string;
}): void {
	console.log('[Noctown Trade] Trade confirm reset by:', data.resetBy);

	// トレードパネルが開いている場合は更新
	if (tradePanelRef.value && showTradePanel.value) {
		tradePanelRef.value.refreshTrades();
	}
}

// T033: トレードキャンセルイベントハンドラー
function handleTradeCancelled(data: {
	tradeId: string;
	cancelledBy: string;
	reason: 'user_cancelled' | 'disconnected' | 'expired';
}): void {
	console.log('[Noctown Trade] Trade cancelled:', data);

	// トレードパネルを閉じる
	showTradePanel.value = false;
	tradeTargetPlayer.value = null;

	// キャンセル通知を表示
	const reasonText = data.reason === 'user_cancelled' ? '相手がトレードをキャンセルしました'
		: data.reason === 'disconnected' ? '相手が切断したためトレードがキャンセルされました'
		: 'トレードの有効期限が切れました';

	os.alert({
		type: 'warning',
		title: 'トレードがキャンセルされました',
		text: reasonText,
	});
}

// トレード完了イベントハンドラー
function handleTradeCompletedEvent(data: {
	tradeId: string;
}): void {
	console.log('[Noctown Trade] Trade completed:', data);

	// トレードパネルを閉じる
	showTradePanel.value = false;
	tradeTargetPlayer.value = null;

	// 完了通知を表示
	os.alert({
		type: 'success',
		title: 'トレード完了',
		text: 'トレードが正常に完了しました。',
	});
}

// FR-017: Start warning check interval for 3+ seconds since last ping
function startWarningCheck(): void {
	warningCheckInterval = window.setInterval(() => {
		if (!engine) return;

		// Check all remote players for warning status
		engine.checkRemotePlayerWarnings();
	}, 1000); // Every 1 second
}

// ============================================
// 仕様: T021-T026 ワープ機能関連ハンドラ
// ============================================

/**
 * T022: ワープゲート衝突時のコールバック
 * エンジンから呼び出され、WebSocketでwarpStartを送信
 */
function handleWarpCollision(gateId: string, targetWorldId: string | null): void {
	if (!connection.value) return;

	console.log('[Noctown] Warp collision detected:', gateId, targetWorldId);
	connection.value.send('warpStart', {
		gateId,
		targetWorldId,
	});
}

/**
 * T023: warpStartedイベントのハンドラ
 * ワープエフェクトを開始
 */
function handleWarpStarted(): void {
	console.log('[Noctown] Warp started');
	if (engine) {
		engine.startWarp();
	}
	isWarpEffectActive.value = true;
}

/**
 * T023: worldJoinedイベントのハンドラ
 * ワールドデータを保存（エフェクト完了後にシーン切り替え）
 * 仕様: FR-023〜FR-027 ワールド別データを含む
 */
function handleWorldJoined(data: {
	worldId: string | null;
	worldType: 'default' | 'shrine';
	worldDisplayName: string | null;
	spawnPosition: { x: number; y: number; z: number };
	playersInWorld: PlayerData[];
	// 仕様: FR-023〜FR-027 ワールド別データ
	placedItems?: PlacedItemData[];
	droppedItems?: DroppedItemData[];
	chickens?: ChickenData[];
	cows?: CowData[];
	shrineData?: {
		saisenBoxPosition: { x: number; y: number; z: number };
		suzuPosition: { x: number; y: number; z: number };
		returnGatePosition: { x: number; y: number; z: number };
	};
	isReconnect?: boolean;
}): void {
	console.log('[Noctown] World joined:', data.worldType, data.worldId, 'isReconnect:', data.isReconnect);

	// ワールドIDを更新
	worldId = data.worldId;

	if (data.isReconnect) {
		// 再接続時はエフェクトなしで即座にシーン切り替え
		if (engine) {
			engine.switchWorld(data.worldId, data.worldType, data.spawnPosition, data.shrineData);

			// 仕様: FR-029 ワールド切り替え時にチャンクキャッシュをクリア
			loadedChunks.clear();
			console.log('[Noctown] handleWorldJoined (reconnect): cleared loadedChunks cache');

			// プレイヤー位置を更新
			currentX.value = data.spawnPosition.x;
			currentY.value = data.spawnPosition.y;
			currentZ.value = data.spawnPosition.z;

			// 他プレイヤーを追加
			for (const player of data.playersInWorld) {
				if (player.id !== playerData.value?.id) {
					engine.addRemotePlayer(player);
				}
			}

			// 仕様: FR-023〜FR-027 ワールド別データをリロード
			reloadWorldData(data);

			// 仕様: デフォルトワールドの場合はチャンクをロード
			if (data.worldType === 'default') {
				loadNearbyChunks(currentX.value, currentZ.value);
			}
		}
	} else {
		// 通常のワープ時はデータを保存してエフェクト完了を待つ
		pendingWorldData.value = {
			worldId: data.worldId,
			worldType: data.worldType,
			spawnPosition: data.spawnPosition,
			shrineData: data.shrineData,
			playersInWorld: data.playersInWorld,
			// 仕様: FR-023〜FR-027 ワールド別データも保存
			placedItems: data.placedItems,
			droppedItems: data.droppedItems,
			chickens: data.chickens,
			cows: data.cows,
		};

		// 仕様: ワープエフェクトのアニメーション時間(0.8秒)後にフェードアウトを開始
		// フェードアウト完了後に @after-leave で onWarpAnimationComplete が呼ばれる
		window.setTimeout(() => {
			isWarpEffectActive.value = false;
		}, 800);
	}
}

/**
 * 仕様: FR-023〜FR-027 ワールド別データをリロード
 * ワールド切り替え時に設置アイテム、落ちているアイテム、動物を更新
 */
function reloadWorldData(data: {
	placedItems?: PlacedItemData[];
	droppedItems?: DroppedItemData[];
	chickens?: ChickenData[];
	cows?: CowData[];
}): void {
	if (!engine) return;

	console.log('[Noctown] Reloading world data:', {
		placedItems: data.placedItems?.length ?? 0,
		droppedItems: data.droppedItems?.length ?? 0,
		chickens: data.chickens?.length ?? 0,
		cows: data.cows?.length ?? 0,
	});

	// 仕様: FR-023〜FR-027 ワールド切り替え時は常にクリアしてからリロード
	// データがundefinedの場合もクリアする（別ワールドのデータが残らないように）

	// 設置アイテムをリロード（FR-023）
	engine.clearPlacedItems();
	if (data.placedItems) {
		for (const item of data.placedItems) {
			engine.addPlacedItem(item);
		}
	}

	// 落ちているアイテムをリロード（FR-025）
	engine.clearDroppedItems();
	if (data.droppedItems) {
		for (const item of data.droppedItems) {
			engine.addDroppedItem(item);
		}
	}

	// 動物をリロード（FR-024）
	// 仕様: 神社ワールドでは動物データがないため、クリアだけ実行される
	engine.clearChickens();
	if (data.chickens) {
		for (const chicken of data.chickens) {
			engine.addChicken(chicken);
		}
	}

	engine.clearCows();
	if (data.cows) {
		for (const cow of data.cows) {
			engine.addCow(cow);
		}
	}
}

/**
 * T021: ワープアニメーション完了時のコールバック
 * pendingWorldDataを使ってシーンを切り替え
 */
function onWarpAnimationComplete(): void {
	console.log('[Noctown] Warp animation complete');

	if (pendingWorldData.value && engine) {
		const data = pendingWorldData.value;

		// 仕様: ワールドIDを更新（チャンクロード時に必要）
		worldId = data.worldId;

		engine.switchWorld(data.worldId, data.worldType, data.spawnPosition, data.shrineData);

		// プレイヤー位置を更新
		currentX.value = data.spawnPosition.x;
		currentY.value = data.spawnPosition.y;
		currentZ.value = data.spawnPosition.z;

		// 他プレイヤーを追加
		if (data.playersInWorld) {
			for (const player of data.playersInWorld) {
				if (player.id !== playerData.value?.id) {
					engine.addRemotePlayer(player);
				}
			}
		}

		// 仕様: FR-029 ワールド切り替え時にチャンクキャッシュをクリア
		// エンジン側のチャンクはswitchWorldでクリアされるが、Vue側のキャッシュも同期する
		loadedChunks.clear();
		console.log('[Noctown] onWarpAnimationComplete: cleared loadedChunks cache');

		// 仕様: FR-023〜FR-027 ワールド別データをリロード
		reloadWorldData(data);

		// 仕様: デフォルトワールドに戻った場合はチャンクをロード
		if (data.worldType === 'default') {
			loadNearbyChunks(currentX.value, currentZ.value);
		}

		pendingWorldData.value = null;
	}

	isWarpEffectActive.value = false;
}

/**
 * T023: warpFailedイベントのハンドラ
 */
function handleWarpFailed(data: { code: string; message: string }): void {
	console.error('[Noctown] Warp failed:', data.code, data.message);
	isWarpEffectActive.value = false;
	if (engine) {
		// isWarping フラグをリセット（再度ワープ可能にする）
		// engine には直接アクセスできないので、switchWorldでリセット
	}
	os.alert({
		type: 'error',
		title: 'ワープ失敗',
		text: data.message,
	});
}

/**
 * T025: playerWarpedイベントのハンドラ
 * 他プレイヤーのワープを処理
 */
function handlePlayerWarped(data: {
	playerId: string;
	direction: 'left' | 'joined';
	toWorldId?: string | null;
	fromWorldId?: string | null;
	playerData?: PlayerData;
}): void {
	if (!engine) return;

	// 自分のプレイヤーIDは無視
	if (data.playerId === playerData.value?.id) return;

	const currentWorldId = engine.getCurrentWorldId();

	if (data.direction === 'left') {
		// プレイヤーが退出した
		// 現在のワールドから離れた場合のみ削除
		engine.removeRemotePlayer(data.playerId);
		console.log('[Noctown] Remote player warped out:', data.playerId);
	} else if (data.direction === 'joined' && data.playerData) {
		// プレイヤーが参加した
		// 自分と同じワールドに参加した場合のみ追加
		if (data.fromWorldId === currentWorldId || data.toWorldId === currentWorldId) {
			engine.addRemotePlayer(data.playerData);
			console.log('[Noctown] Remote player warped in:', data.playerId);
		}
	}
}

/**
 * T037: bellRingイベントのハンドラ
 * 鈴アニメーションを開始
 */
function handleBellRing(): void {
	if (engine) {
		engine.startBellAnimation();
	}
}

/**
 * T035: 賽銭ダイアログを開く（賽銭箱クリック時）
 */
function openSaisenDialog(): void {
	if (!engine || engine.getCurrentWorldType() !== 'shrine') {
		os.alert({
			type: 'warning',
			title: '神社ワールド限定',
			text: 'お賽銭は神社ワールドでのみ行えます。',
		});
		return;
	}
	showSaisenDialog.value = true;
}

/**
 * 仕様: T086 賽銭ダイアログを閉じる
 */
function closeSaisenDialog(): void {
	showSaisenDialog.value = false;
}

/**
 * 仕様: T037 鈴クリック時の処理
 * 鈴を鳴らすアニメーションとサウンドを再生
 */
function handleSuzuClick(): void {
	if (!engine || engine.getCurrentWorldType() !== 'shrine') {
		return;
	}
	console.log('[Noctown] Suzu clicked - ringing bell');
	// 鈴のアニメーションを開始
	engine.startBellAnimation();
	// TODO: 将来的にはWebSocketでサーバーに通知して、他プレイヤーにも鈴の音が聞こえるようにする
}

/**
 * T039: 賽銭完了時のコールバック
 */
function handleSaisenOffer(amount: number): void {
	console.log('[Noctown] Saisen offered via dialog:', amount);
	// WebSocketで通知することもできるが、REST APIで処理済み
}

/**
 * T036: saisenCompletedイベントのハンドラ
 * トースト表示と残高更新
 */
function handleSaisenCompleted(data: {
	amount: number;
	totalSaisen: number;
	mochiAwarded: number;
	newBalance: number;
	isFirstOffer: boolean;
}): void {
	console.log('[Noctown] Saisen completed:', data);
	// ダイアログ内で処理済みのため、ここではログのみ
	// 他プレイヤーからの賽銭通知などに使える
}

function handleKeyDown(e: KeyboardEvent): void {
	// 仕様: キーリピートを無視（キー押しっぱなしで連続発火を防止）
	if (e.repeat) return;

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
		showEmotion(emotionEmojis.value[0]);
	} else if (e.code === 'Digit2') {
		showEmotion(emotionEmojis.value[1]);
	} else if (e.code === 'Digit3') {
		showEmotion(emotionEmojis.value[2]);
	} else if (e.code === 'Digit4') {
		showEmotion(emotionEmojis.value[3]);
	} else if (e.code === 'Digit5') {
		showEmotion(emotionEmojis.value[4]);
	} else if (e.code === 'Digit6') {
		showEmotion(emotionEmojis.value[5]);
	}
}

// 仕様: インベントリパネルの表示/非表示をトグル
function toggleInventory(): void {
	showInventory.value = !showInventory.value;
	showQuestPanel.value = false;
	showFarmPanel.value = false;
	showChatHistoryPanel.value = false;
}

function toggleQuestPanel(): void {
	showQuestPanel.value = !showQuestPanel.value;
	showInventory.value = false;
	showFarmPanel.value = false;
	showChatHistoryPanel.value = false;
	if (showQuestPanel.value && questPanelRef.value) {
		questPanelRef.value.refresh();
	}
}

function toggleFarmPanel(): void {
	showFarmPanel.value = !showFarmPanel.value;
	showInventory.value = false;
	showQuestPanel.value = false;
	showChatHistoryPanel.value = false;
}

// FR-029: Toggle chat window.history panel
function toggleChatHistoryPanel(): void {
	showChatHistoryPanel.value = !showChatHistoryPanel.value;
	showInventory.value = false;
	showQuestPanel.value = false;
	showFarmPanel.value = false;
	if (showChatHistoryPanel.value && chatHistoryPanelRef.value) {
		chatHistoryPanelRef.value.refresh();
	}
}

// T012-T013: showEmotion function updated for EmotionEmoji type
function showEmotion(item: EmotionEmoji): void {
	if (!engine) return;

	// Show emotion on local player (pass emoji data for custom emoji support)
	engine.showLocalPlayerEmote(item.emoji, item.isCustom, item.url);

	// Send emotion event to server via WebSocket with isCustomEmoji flag
	if (connection.value) {
		connection.value.send('emotion', {
			emoji: item.emoji,
			isCustomEmoji: item.isCustom,
		});
	}
}

function handleFarmUpdated(): void {
	// Refresh nearby items when farm is updated
	loadNearbyItems(currentX.value, currentZ.value);
	// Refresh nearby pets when chicken/cow is placed
	loadNearbyPets(currentX.value, currentZ.value);
}

/**
 * 仕様: リロードボタンのハンドラー
 * - 全てのインターバルとリソースを完全にクリーンアップしてから再接続
 * - moveInterval、heartbeatInterval、pingIntervalの重複登録を防止
 * 修正日: 2025-12-14
 * 修正内容: リロード時に既存のインターバルをクリアしないため移動速度が倍々に増えるバグを修正
 */
async function handleReload(): Promise<void> {
	if (isReloading.value || reloadCooldown.value) return;

	isReloading.value = true;
	try {
		// 1. Clear all intervals and timeouts FIRST
		if (moveInterval) {
			window.clearInterval(moveInterval);
			moveInterval = null;
		}
		if (heartbeatInterval) {
			window.clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}
		if (pingInterval) {
			window.clearInterval(pingInterval);
			pingInterval = null;
		}
		if (warningCheckInterval) {
			window.clearInterval(warningCheckInterval);
			warningCheckInterval = null;
		}
		// Clear all pending ping timeouts
		for (const pending of pendingPings.values()) {
			window.clearTimeout(pending.timeoutId);
		}
		pendingPings.clear();
		// Clear pending player info pings
		for (const pending of pendingPlayerInfoPings.values()) {
			window.clearTimeout(pending.timeoutId);
		}
		pendingPlayerInfoPings.clear();

		// 2. Unload all chunks
		if (engine) {
			engine.unloadAllChunks();
		}

		// 3. Remove all remote players
		if (engine) {
			engine.removeAllRemotePlayers();
		}

		// 4. Clear loaded chunks cache
		loadedChunks.clear();

		// 5. Disconnect WebSocket
		if (connection.value) {
			connection.value.dispose();
			connection.value = null;
		}
		isConnected.value = false;

		// 6. Re-window.fetch player position from server
		const data = await noctownApi<NoctownPlayerResponse>('noctown/player');
		currentX.value = data.positionX;
		currentY.value = data.positionY;
		currentZ.value = data.positionZ;
		currentRotation = data.rotation;

		// 7. Reconnect WebSocket (this will create new intervals)
		await connectStream();

		// 8. Reload chunks around player
		await loadNearbyChunks(currentX.value, currentZ.value);

		// 9. Reload nearby players
		await fetchNearbyPlayers();

		// 10. Reload nearby items
		await loadNearbyItems(currentX.value, currentZ.value);
		// 仕様: ハードリロード時にアイテムロード位置をリセット
		lastItemLoadX = currentX.value;
		lastItemLoadZ = currentZ.value;

		// 11. Reload nearby NPCs
		await loadNearbyNpcs(currentX.value, currentZ.value);
	} catch (e) {
		console.error('Failed to reload:', e);
	} finally {
		isReloading.value = false;

		// 2-second cooldown
		reloadCooldown.value = true;
		window.setTimeout(() => {
			reloadCooldown.value = false;
		}, 2000);
	}
}

// 仕様: FR-030 Eキーでのインタラクション（NPC会話、アイテム拾得）
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

	// 仕様: FR-030 近くにドロップアイテムがあれば拾う
	await tryPickupDroppedItem();
}

// 仕様: FR-030 ドロップアイテムを拾う処理
async function tryPickupDroppedItem(): Promise<void> {
	if (!engine) return;

	const item = engine.getNearestDroppedItem(2);
	if (!item) return;

	try {
		const result = await noctownApi<{ success: boolean; item?: { name: string } }>('noctown/item/pickup', {
			droppedItemId: item.id,
		});

		if (result.success) {
			// 仕様: FR-030 拾得成功時にエンジンからドロップアイテムを削除
			engine.removeDroppedItem(item.id);
			// インベントリを更新
			if (inventoryRef.value) {
				inventoryRef.value.refresh();
			}
		}
	} catch (error) {
		console.error('Failed to pick up item:', error);
	}
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

// FR-022: Load nearby pets (cows and chickens)
// 仕様: FR-024 worldIdでフィルタリング
async function loadNearbyPets(x: number, z: number): Promise<void> {
	if (!engine) return;

	// 仕様: 神社ワールドではペットをロードしない（動物はデフォルトワールドのみ）
	if (engine.getCurrentWorldType() === 'shrine' || worldId === 'shrine-world-001') {
		return;
	}

	try {
		const pets = await noctownApi<PetInfo[]>('noctown/pets/nearby', {
			centerX: x,
			centerZ: z,
			radius: 50,
			worldId: worldId ?? undefined, // null → undefined（API側でNULL条件として処理）
		});
		engine.addPets(pets);
	} catch (e) {
		console.error('Failed to load nearby pets:', e);
	}
}

function handlePlaceItem(item: InventoryItem): void {
	selectedItemForPlace = { id: item.id, itemId: item.itemId };
	placeMode.value = true;
	showInventory.value = false;
	// 仕様: クリックハンドラはhandleCanvasClick内で処理するため、別途追加不要
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
	} catch (e: unknown) {
		console.error('Failed to place item:', e);
		// 仕様: FR-032 エラーコードに応じたメッセージを表示
		const apiError = e as { code?: string } | null;
		let errorMessage = 'アイテムの設置に失敗しました';
		if (apiError?.code === 'ITEM_NOT_PLACEABLE') {
			errorMessage = 'このアイテムは設置できません';
		} else if (apiError?.code === 'PLACEMENT_LIMIT_REACHED') {
			errorMessage = '設置上限（100個）に達しています';
		} else if (apiError?.code === 'ITEM_NOT_FOUND') {
			errorMessage = 'アイテムが見つかりません';
		}
		os.alert({
			type: 'error',
			text: errorMessage,
		});
	}

	cancelPlaceMode();
}

function cancelPlaceMode(): void {
	placeMode.value = false;
	selectedItemForPlace = null;
	// 仕様: クリックハンドラはhandleCanvasClick内で処理するため、別途削除不要
}

// 仕様: FR-030 インベントリからアイテムを捨てる（地面にドロップ）
// quantity: 捨てる数量（デフォルト1）
async function handleDropItem(item: InventoryItem, quantity: number = 1): Promise<void> {
	if (!engine) return;

	const pos = engine.getLocalPlayerPosition();
	if (!pos) return;

	// プレイヤーの少し前方にドロップ（回転を考慮）
	const dropDistance = 1.5;
	const dropX = pos.x + Math.sin(currentRotation) * dropDistance;
	const dropZ = pos.z + Math.cos(currentRotation) * dropDistance;

	try {
		const result = await noctownApi<{ droppedItemId: string }>('noctown/item/drop', {
			playerItemId: item.id,
			quantity: quantity,
			positionX: dropX,
			positionY: pos.y,
			positionZ: dropZ,
		});

		if (result.droppedItemId) {
			// 仕様: FR-030 ドロップ成功時にエンジンにアイテムを追加
			engine.addDroppedItem({
				id: result.droppedItemId,
				itemId: item.itemId,
				itemName: item.itemName,
				itemType: item.itemType,
				emoji: item.emoji,
				imageUrl: item.imageUrl,
				rarity: item.rarity,
				quantity: quantity,
				positionX: dropX,
				positionY: pos.y,
				positionZ: dropZ,
			});

			// インベントリを更新
			if (inventoryRef.value) {
				inventoryRef.value.refresh();
			}
		}
	} catch (error) {
		console.error('Failed to drop item:', error);
	}
}

// 仕様: ウォレットからノクタコインを捨てる（地面にドロップ）
async function handleDropCurrency(amount: number): Promise<void> {
	if (!engine) return;

	const pos = engine.getLocalPlayerPosition();
	if (!pos) return;

	// プレイヤーの少し前方にドロップ（回転を考慮）
	const dropDistance = 1.5;
	const dropX = pos.x + Math.sin(currentRotation) * dropDistance;
	const dropZ = pos.z + Math.cos(currentRotation) * dropDistance;

	try {
		const result = await noctownApi<{ droppedItemId: string }>('noctown/item/drop-currency', {
			amount: amount,
			positionX: dropX,
			positionY: pos.y,
			positionZ: dropZ,
		});

		if (result.droppedItemId) {
			// 仕様: ドロップ成功時にエンジンにコインを追加
			engine.addDroppedItem({
				id: result.droppedItemId,
				itemId: 'currency',
				itemName: 'ノクタコイン',
				itemType: 'currency',
				emoji: '🪙',
				imageUrl: null,
				rarity: 1,
				quantity: amount,
				positionX: dropX,
				positionY: pos.y,
				positionZ: dropZ,
			});

			// インベントリを更新
			if (inventoryRef.value) {
				inventoryRef.value.refresh();
			}
		}
	} catch (error) {
		console.error('Failed to drop currency:', error);
	}
}

// T030: Joystick event handlers
function handleJoystickMove(direction: { x: number; z: number }): void {
	// Update joystick movement state
	joystickMovement = direction;
}

/**
 * 仕様: ジョイスティックを離した時の処理
 * - joystickMovementをリセット
 * - clearInput()を呼んでジョイスティック入力モードを終了
 * 修正日: 2025-12-14
 */
function handleJoystickEnd(): void {
	// Reset joystick movement when released
	joystickMovement = { x: 0, z: 0 };

	// Reset engine input (animation will return to idle)
	// clearInput()を使用してisJoystickActiveフラグもリセット
	if (engine) {
		engine.clearInput();
	}
}

function cleanup(): void {
	if (moveInterval) {
		window.clearInterval(moveInterval);
		moveInterval = null;
	}

	if (heartbeatInterval) {
		window.clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}

	// FR-017: Clear ping/pong intervals
	if (pingInterval) {
		window.clearInterval(pingInterval);
		pingInterval = null;
	}
	if (warningCheckInterval) {
		window.clearInterval(warningCheckInterval);
		warningCheckInterval = null;
	}
	// Clear all pending ping timeouts
	for (const pending of pendingPings.values()) {
		window.clearTimeout(pending.timeoutId);
	}
	pendingPings.clear();

	if (connection.value) {
		connection.value.dispose();
		connection.value = null;
	}

	// FR-018: Remove canvas click listener
	if (engine) {
		const rendererElement = engine.getRendererDomElement();
		rendererElement.removeEventListener('click', handleCanvasClick);
		engine.dispose();
		engine = null;
	}

	// FR-018: Clear pending player info pings
	for (const [pingId, pending] of pendingPlayerInfoPings) {
		window.clearTimeout(pending.timeoutId);
	}
	pendingPlayerInfoPings.clear();

	window.removeEventListener('keydown', handleKeyDown);

	// Remove resize handler
	if (resizeHandler) {
		window.removeEventListener('resize', resizeHandler);
		resizeHandler = null;
	}

	isConnected.value = false;
}

function retry(): void {
	cleanup();
	initialize();
}

// FR-175: Mobile scrollbar prevention
function setupMobileScrollPrevention(): void {
	if (window.innerWidth <= 768) {
		window.document.body.style.overflow = 'hidden';
		window.document.body.style.position = 'fixed';
		window.document.body.style.width = '100%';
		window.document.body.style.height = '100%';
		window.document.documentElement.style.overflow = 'hidden';
	}
}

function cleanupMobileScrollPrevention(): void {
	window.document.body.style.overflow = '';
	window.document.body.style.position = '';
	window.document.body.style.width = '';
	window.document.body.style.height = '';
	window.document.documentElement.style.overflow = '';
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

// 仕様: ゲームキャンバス領域
// touch-action: manipulation でiOSのダブルタップズームを無効化
// これにより、ダブルタップ時のビューポートシフトを防ぎ、
// fixed要素（ジョイスティック、絵文字ボタン）の当たり判定ずれを解消
.gameCanvas {
	flex: 1;
	position: relative;
	background: linear-gradient(180deg, #87ceeb 0%, #e0f0ff 100%);
	border-radius: 8px;
	overflow: hidden;
	touch-action: manipulation;
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
// 修正: フォントサイズを小さくして目立たなくする
.coordinateDisplay {
	position: absolute;
	top: 16px;
	left: 16px;
	background: rgba(0, 0, 0, 0.5);
	color: rgba(255, 255, 255, 0.8);
	padding: 4px 8px;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 11px;
	font-weight: 500;
	z-index: 100;
	pointer-events: none;
	user-select: none;
}

// 仕様: TradePanelデバッグ情報（パネルが閉じても残る）
.tradePanelDebugPersistent {
	position: absolute;
	top: 50px;
	left: 10px;
	right: 10px;
	background: rgba(26, 26, 46, 0.95);
	color: #00ff88;
	padding: 8px 12px;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 10px;
	z-index: 100;
	pointer-events: none;
	user-select: none;
	word-break: break-all;
	line-height: 1.4;
}

// FR-016: Top-right button group (inventory + reload + settings)
.topRightButtonGroup {
	position: absolute;
	top: calc(env(safe-area-inset-top, 16px) + 10px);
	right: 16px;
	display: flex;
	gap: 4px;
	z-index: 100;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 22px;
	padding: 0;

	@media (max-width: 768px) {
		top: calc(env(safe-area-inset-top, 10px) + 10px);
		right: 10px;
	}
}

// 仕様: 右上ボタングループのボタンサイズ（4ボタン用に小さめ）
.groupButton {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: transparent;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 17px;
	transition: background 0.2s, transform 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	&:active {
		transform: scale(0.95);
	}
}

.groupButtonDisabled {
	opacity: 0.5;
	cursor: not-allowed;

	&:hover {
		background: transparent;
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
/* touch-action: manipulation でiOSダブルタップズームを無効化 */
/* PWA safe-area-inset-bottom を考慮して絵文字パネルの位置を調整 */
.emotionPanel {
	position: absolute;
	bottom: 18px;
	right: 20px;
	left: auto;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	z-index: 50;
	touch-action: manipulation;

	// FR-007-2: モバイルで親指操作しやすいよう位置を調整
	// デスクトップ（18px）→ モバイル（150px + safe-area）→ 小型（150px + safe-area）
	/* Mobile: Adjusted position for better thumb reach (PWA safe area aware) */
	@media (max-width: 768px) {
		bottom: calc(116px + env(safe-area-inset-bottom, 0px));
		right: 16px;
	}

	// 小型モバイル: 親指で届きやすく配置
	/* Small mobile screens: Positioned for easier reach */
	@media (max-width: 480px) {
		bottom: calc(116px + env(safe-area-inset-bottom, 0px));
		right: 12px;
		gap: 6px;
	}
}

/* Swapped layout: emotion panel on left side */
.emotionPanelLeft {
	right: auto;
	left: 20px;

	@media (max-width: 768px) {
		right: auto;
		left: 16px;
	}

	@media (max-width: 480px) {
		right: auto;
		left: 12px;
	}
}

// 仕様: 絵文字ボタン。overflow: hiddenで大きな画像がはみ出さないようにする
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
	overflow: hidden;

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

// T011: Custom emoji image style
// 仕様: アスペクト比1:1で固定し、大きな画像でもボタンからはみ出さないようにする
// object-fit: coverで画像を1:1の領域にフィットさせる（歪みなし）
.customEmoji {
	width: 24px;
	height: 24px;
	max-width: 100%;
	max-height: 100%;
	aspect-ratio: 1 / 1;
	object-fit: cover;

	@media (max-width: 768px) {
		width: 22px;
		height: 22px;
	}

	@media (max-width: 480px) {
		width: 20px;
		height: 20px;
	}
}

/* Settings panel overlay */
.settingsPanelOverlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.settingsPanel {
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	width: 90%;
	max-width: 400px;
	max-height: 80vh;
	overflow: hidden;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.settingsHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: 600;
	font-size: 16px;
}

.settingsCloseBtn {
	background: none;
	border: none;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 20px;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.6;

	&:hover {
		opacity: 1;
	}
}

.settingsContent {
	padding: 16px;
}

.settingsItem {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.settingsItemLabel {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 500;
	color: var(--MI_THEME-fg);

	i {
		font-size: 18px;
		opacity: 0.8;
	}
}

.settingsItemDescription {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	margin-bottom: 8px;
}

/* Toggle switch */
.toggle {
	position: relative;
	display: inline-block;
	width: 50px;
	height: 28px;

	input {
		opacity: 0;
		width: 0;
		height: 0;
	}
}

.toggleSlider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--MI_THEME-divider);
	transition: 0.3s;
	border-radius: 28px;

	&::before {
		position: absolute;
		content: "";
		height: 22px;
		width: 22px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}
}

.toggle input:checked + .toggleSlider {
	background-color: var(--MI_THEME-accent);
}

.toggle input:checked + .toggleSlider::before {
	transform: translateX(22px);
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

// デバッグ用: トレード状態表示
.tradeDebugInfo {
	position: fixed;
	top: 10px;
	left: 50%;
	transform: translateX(-50%);
	background: #000;
	color: #0f0;
	padding: 8px 16px;
	border-radius: 4px;
	font-size: 12px;
	font-family: monospace;
	z-index: 1002;
	white-space: nowrap;
}

// FR-070: Trade panel overlay
// 仕様: トレードパネルのオーバーレイ表示
.tradePanelOverlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1001;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
