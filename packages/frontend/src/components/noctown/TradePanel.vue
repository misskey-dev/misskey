<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
仕様: トレードパネル（バーターモード）
- 左カラム: 相手のオファー（表示のみ）
- 右カラム: 自分のオファー（編集可能）
- 交換OKボタン: 押すと自分のエリアがロック、もう一度押すとロック解除
- 両者ロック時: 「交換」ボタンが出現
- リアルタイム同期: WebSocketで相手の変更を即座に反映
-->

<template>
<!-- 仕様: T004 イベント伝播制御でクリック時画面消失バグを修正 -->
<div :class="$style.container" @click.stop @touchstart.stop @touchend.stop>
	<div :class="$style.header">
		<h2 :class="$style.title">
			<i class="ti ti-arrows-exchange"></i>
			トレード
		</h2>
		<button :class="$style.closeBtn" @click="handleClose">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<!-- ローディング状態 -->
	<div v-if="isLoading" :class="$style.loading">
		<MkLoading/>
	</div>

	<!-- エラー状態 -->
	<div v-else-if="lastError" :class="$style.error">
		<i class="ti ti-alert-circle"></i>
		<p>{{ lastError }}</p>
		<button :class="$style.retryBtn" @click="retryLoad">再読み込み</button>
	</div>

	<!-- トレードリクエスト送信モード（targetPlayerがある場合） -->
	<div v-else-if="props.targetPlayer && !tradeDetail" :class="$style.requestMode">
		<div :class="$style.playerInfo">
			<img
				v-if="props.targetPlayer.avatarUrl"
				:src="props.targetPlayer.avatarUrl"
				:class="$style.avatar"
			/>
			<div v-else :class="$style.avatarPlaceholder">
				<i class="ti ti-user"></i>
			</div>
			<span>{{ props.targetPlayer.username }}にトレードリクエストを送る</span>
		</div>

		<!-- 2カラムレイアウト: 左インベントリ、右オファー -->
		<div :class="$style.tradeColumns">
			<!-- 左カラム: インベントリ -->
			<div :class="$style.column">
				<h3 :class="$style.columnTitle">
					<i class="ti ti-backpack"></i>
					インベントリ
				</h3>
				<div :class="$style.itemList" @touchstart="handleTouchStart">
					<div v-if="inventory.length === 0" :class="$style.emptyMessage">
						インベントリが空です
					</div>
					<div
						v-for="item in inventory"
						:key="item.id"
						:class="[$style.itemCard, isItemInOffer(item.itemId) && $style.selected]"
						@click.stop="toggleItemInOffer(item)"
						@touchend.stop.prevent="handleItemTouch($event, item)"
					>
						<span :class="$style.itemName">{{ item.itemName }}</span>
						<span :class="$style.itemQty">x{{ item.quantity }}</span>
					</div>
				</div>
			</div>

			<!-- 右カラム: オファー -->
			<div :class="$style.column">
				<h3 :class="$style.columnTitle">
					<i class="ti ti-gift"></i>
					オファー
				</h3>
				<div :class="$style.offerList">
					<div v-if="myOffer.length === 0" :class="$style.emptyMessage">
						左からアイテムを選択
					</div>
					<!-- 仕様: オファーアイテム（削除ボタン付き） -->
					<div
						v-for="(item, index) in myOffer"
						:key="index"
						:class="$style.offerItem"
					>
						<span :class="$style.itemName">{{ item.name }}</span>
						<input
							v-model.number="item.quantity"
							type="number"
							inputmode="numeric"
							min="1"
							:max="getMaxQuantity(item.itemId)"
							:class="$style.quantityInput"
							@touchstart.stop
						/>
						<button
							:class="$style.removeBtn"
							@click.stop="removeFromOffer(index)"
							@touchend.stop.prevent="removeFromOffer(index)"
						>
							<i class="ti ti-x"></i>
						</button>
					</div>
				</div>

				<!-- 仕様: 通貨入力（モバイル対応: type="text" + inputmode="numeric"） -->
				<div :class="$style.currencySection" @click.stop>
					<label>
						<i class="ti ti-coin"></i>
						通貨:
					</label>
					<input
						:value="offeredCurrency"
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						:class="$style.currencyInput"
						@input="offeredCurrency = parseInt(($event.target as HTMLInputElement).value) || 0"
					/>
				</div>
			</div>
		</div>

		<!-- 送信ボタン -->
		<button
			:class="[$style.actionBtn, $style.primary, !canSendRequest && $style.disabled]"
			:disabled="!canSendRequest || isSending"
			@click="sendTradeRequest"
		>
			<template v-if="isSending">
				<MkLoading :em="true"/>
			</template>
			<template v-else>
				<i class="ti ti-send"></i>
				トレードリクエストを送る
			</template>
		</button>
	</div>

	<!-- バーターモード（交渉中） -->
	<div v-else-if="tradeDetail" :class="$style.barterMode">
		<!-- ステータス表示 -->
		<div v-if="tradeDetail.status === 'pending'" :class="[$style.statusBadge, $style.pending]">
			承認待ち
		</div>
		<div v-else-if="tradeDetail.status === 'accepted'" :class="[$style.statusBadge, $style.accepted]">
			交渉中
		</div>

		<!-- 相手の情報 -->
		<div :class="$style.partnerInfo">
			<span>{{ otherPlayerName }}とのトレード</span>
		</div>

		<!-- 2カラムレイアウト: 左=相手、右=自分 -->
		<div :class="$style.barterColumns">
			<!-- 左カラム: 相手のオファー（表示のみ） -->
			<div :class="[$style.barterColumn, otherConfirmed && $style.locked]">
				<h3 :class="$style.columnTitle">
					{{ otherPlayerName }}のオファー
					<span v-if="otherConfirmed" :class="$style.confirmedBadge">
						<i class="ti ti-check"></i> 交換OK
					</span>
				</h3>
				<div :class="$style.offerDisplay">
					<div v-if="otherItems.length === 0 && otherCurrency === 0" :class="$style.emptyMessage">
						アイテムなし
					</div>
					<div
						v-for="item in otherItems"
						:key="item.itemId"
						:class="$style.displayItem"
					>
						<span>{{ item.name }}</span>
						<span :class="$style.itemQty">x{{ item.quantity }}</span>
					</div>
					<div v-if="otherCurrency > 0" :class="$style.currencyDisplay">
						<i class="ti ti-coin"></i>
						{{ otherCurrency }}G
					</div>
				</div>
			</div>

			<!-- 右カラム: 自分のオファー（編集可能、ロック時はグレーアウト） -->
			<div :class="[$style.barterColumn, myConfirmed && $style.locked]">
				<h3 :class="$style.columnTitle">
					あなたのオファー
					<span v-if="myConfirmed" :class="$style.confirmedBadge">
						<i class="ti ti-check"></i> 交換OK
					</span>
				</h3>

				<!-- ロック解除状態: 編集可能 -->
				<template v-if="!myConfirmed">
					<div :class="$style.offerList">
						<div v-if="myBarterOffer.length === 0" :class="$style.emptyMessage">
							アイテムを追加
						</div>
						<!-- 仕様: バーターオファーアイテム（削除ボタン付き） -->
						<div
							v-for="(item, index) in myBarterOffer"
							:key="index"
							:class="$style.offerItem"
						>
							<span :class="$style.itemName">{{ item.name }}</span>
							<input
								v-model.number="item.quantity"
								type="number"
								inputmode="numeric"
								min="1"
								:max="getMaxQuantity(item.itemId)"
								:class="$style.quantityInput"
								@change="onOfferChanged"
								@touchstart.stop
							/>
							<button
								:class="$style.removeBtn"
								@click.stop="removeFromBarterOffer(index)"
								@touchend.stop.prevent="removeFromBarterOffer(index)"
							>
								<i class="ti ti-x"></i>
							</button>
						</div>
					</div>

					<!-- アイテム追加ボタン -->
					<button :class="$style.addItemBtn" @click="showInventoryModal = true">
						<i class="ti ti-plus"></i>
						アイテム追加
					</button>

					<!-- 仕様: 通貨入力（モバイル対応: type="text" + inputmode="numeric"） -->
					<div :class="$style.currencySection" @click.stop>
						<label>
							<i class="ti ti-coin"></i>
							通貨:
						</label>
						<input
							:value="myBarterCurrency"
							type="text"
							inputmode="numeric"
							pattern="[0-9]*"
							:class="$style.currencyInput"
							@input="handleBarterCurrencyInput($event)"
						/>
					</div>
				</template>

				<!-- ロック状態: 表示のみ -->
				<template v-else>
					<div :class="$style.offerDisplay">
						<div v-if="myBarterOffer.length === 0 && myBarterCurrency === 0" :class="$style.emptyMessage">
							アイテムなし
						</div>
						<div
							v-for="item in myBarterOffer"
							:key="item.itemId"
							:class="$style.displayItem"
						>
							<span>{{ item.name }}</span>
							<span :class="$style.itemQty">x{{ item.quantity }}</span>
						</div>
						<div v-if="myBarterCurrency > 0" :class="$style.currencyDisplay">
							<i class="ti ti-coin"></i>
							{{ myBarterCurrency }}G
						</div>
					</div>
				</template>
			</div>
		</div>

		<!-- 両者ロック時: 交換ボタン -->
		<div v-if="myConfirmed && otherConfirmed" :class="$style.exchangeSection">
			<button
				:class="[$style.actionBtn, $style.exchange]"
				:disabled="isSending"
				@click="executeTrade"
			>
				<template v-if="isSending">
					<MkLoading :em="true"/>
				</template>
				<template v-else>
					<i class="ti ti-arrows-exchange"></i>
					交換する
				</template>
			</button>
		</div>

		<!-- アクションボタン -->
		<div :class="$style.actionButtons">
			<!-- 交換OK / 交換OK解除ボタン -->
			<button
				v-if="tradeDetail.status === 'accepted'"
				:class="[$style.actionBtn, myConfirmed ? $style.warning : $style.success]"
				:disabled="isSending"
				@click="toggleConfirm"
			>
				<template v-if="isSending">
					<MkLoading :em="true"/>
				</template>
				<template v-else-if="myConfirmed">
					<i class="ti ti-x"></i>
					交換OK解除
				</template>
				<template v-else>
					<i class="ti ti-check"></i>
					交換OK
				</template>
			</button>

			<!-- 交換拒否ボタン -->
			<button
				:class="[$style.actionBtn, $style.danger]"
				:disabled="isSending"
				@click="cancelTrade"
			>
				<i class="ti ti-x"></i>
				交換拒否
			</button>
		</div>
	</div>

	<!-- フォールバック: トレード相手なし -->
	<div v-else :class="$style.fallback">
		<i class="ti ti-arrows-exchange"></i>
		<p>トレード相手を選択してください</p>
		<button :class="$style.historyBtn" @click="$emit('showHistory')">
			<i class="ti ti-history"></i>
			トレード履歴を見る
		</button>
	</div>

	<!-- インベントリモーダル -->
	<div v-if="showInventoryModal" :class="$style.modal" @click.self="showInventoryModal = false">
		<div :class="$style.modalContent">
			<div :class="$style.modalHeader">
				<span>インベントリから選択</span>
				<button @click="showInventoryModal = false">
					<i class="ti ti-x"></i>
				</button>
			</div>
			<div :class="$style.modalBody">
				<div v-if="inventory.length === 0" :class="$style.emptyMessage">
					インベントリが空です
				</div>
				<div
					v-for="item in inventory"
					:key="item.id"
					:class="$style.itemCard"
					@click="addToBarterOffer(item)"
				>
					<span :class="$style.itemName">{{ item.itemName }}</span>
					<span :class="$style.itemQty">x{{ item.quantity }}</span>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import * as os from '@/os.js';

// 仕様: エラーメッセージのマッピング
const errorMessages: Record<string, string> = {
	PLAYER_NOT_FOUND: 'プレイヤーが見つかりません',
	TARGET_NOT_FOUND: '相手プレイヤーが見つかりません',
	TARGET_OFFLINE: '相手プレイヤーはオフラインです',
	CANNOT_TRADE_WITH_SELF: '自分自身とはトレードできません',
	ACTIVE_TRADE_PENDING: '既に進行中のトレードがあります',
	TRADE_NOT_FOUND: 'トレードが見つかりません',
	INSUFFICIENT_FUNDS: '通貨が不足しています',
	INSUFFICIENT_ITEMS: 'アイテムが不足しています',
};

interface TradeItem {
	itemId: string;
	playerItemId?: string;
	name: string;
	quantity: number;
}

interface TradeDetail {
	id: string;
	initiatorId: string;
	targetId: string;
	initiatorUsername: string;
	targetUsername: string;
	status: string;
	initiatorItems: TradeItem[];
	targetItems: TradeItem[];
	initiatorCurrency: number;
	targetCurrency: number;
	initiatorConfirmed: boolean;
	targetConfirmed: boolean;
	message: string | null;
	expiresAt: string;
}

interface PlayerData {
	id: string;
	username: string;
	avatarUrl: string | null;
}

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
}

const props = defineProps<{
	targetPlayer?: PlayerData | null;
	initialTradeId?: string | null;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'trade-sent'): void;
	(e: 'trade-completed'): void;
	(e: 'showHistory'): void;
}>();

// 状態
const isLoading = ref(true);
const isSending = ref(false);
const lastError = ref<string | null>(null);
const tradeDetail = ref<TradeDetail | null>(null);
const inventory = ref<InventoryItem[]>([]);
const showInventoryModal = ref(false);

// トレードリクエスト送信モード用
const myOffer = ref<TradeItem[]>([]);
const offeredCurrency = ref(0);

// バーターモード用
const myBarterOffer = ref<TradeItem[]>([]);
const myBarterCurrency = ref(0);

// 自分のプレイヤーID
const myPlayerId = ref<string | null>(null);

// WebSocket接続
let stream: ReturnType<typeof useStream> | null = null;
let channel: ReturnType<ReturnType<typeof useStream>['useChannel']> | null = null;

// 計算プロパティ
const canSendRequest = computed(() => {
	return (myOffer.value.length > 0 || offeredCurrency.value > 0) && !isSending.value;
});

// 自分がinitiatorかtargetかを判定
const amInitiator = computed(() => {
	if (!tradeDetail.value || !myPlayerId.value) return false;
	return tradeDetail.value.initiatorId === myPlayerId.value;
});

// 相手のプレイヤー名
const otherPlayerName = computed(() => {
	if (!tradeDetail.value) return '';
	return amInitiator.value ? tradeDetail.value.targetUsername : tradeDetail.value.initiatorUsername;
});

// 自分の確認状態
const myConfirmed = computed(() => {
	if (!tradeDetail.value) return false;
	return amInitiator.value ? tradeDetail.value.initiatorConfirmed : tradeDetail.value.targetConfirmed;
});

// 相手の確認状態
const otherConfirmed = computed(() => {
	if (!tradeDetail.value) return false;
	return amInitiator.value ? tradeDetail.value.targetConfirmed : tradeDetail.value.initiatorConfirmed;
});

// 相手のオファーアイテム
const otherItems = computed(() => {
	if (!tradeDetail.value) return [];
	return amInitiator.value ? tradeDetail.value.targetItems : tradeDetail.value.initiatorItems;
});

// 相手のオファー通貨
const otherCurrency = computed(() => {
	if (!tradeDetail.value) return 0;
	return amInitiator.value ? tradeDetail.value.targetCurrency : tradeDetail.value.initiatorCurrency;
});

// ヘルパー関数
function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

// アイテムの最大数量を取得
function getMaxQuantity(itemId: string): number {
	const item = inventory.value.find(i => i.itemId === itemId);
	return item?.quantity ?? 1;
}

// アイテムがオファーに含まれているか
function isItemInOffer(itemId: string): boolean {
	return myOffer.value.some(i => i.itemId === itemId);
}

// アイテムをオファーに追加/削除（トグル）
function toggleItemInOffer(item: InventoryItem): void {
	const existingIndex = myOffer.value.findIndex(i => i.itemId === item.itemId);
	if (existingIndex >= 0) {
		myOffer.value.splice(existingIndex, 1);
	} else {
		myOffer.value.push({
			itemId: item.itemId,
			playerItemId: item.id,
			name: item.itemName,
			quantity: 1,
		});
	}
}

// オファーから削除
function removeFromOffer(index: number): void {
	myOffer.value.splice(index, 1);
}

// バーターオファーから削除
function removeFromBarterOffer(index: number): void {
	myBarterOffer.value.splice(index, 1);
	onOfferChanged();
}

// バーターオファーに追加
function addToBarterOffer(item: InventoryItem): void {
	const existing = myBarterOffer.value.find(i => i.itemId === item.itemId);
	if (existing) {
		if (existing.quantity < item.quantity) {
			existing.quantity++;
		}
	} else {
		myBarterOffer.value.push({
			itemId: item.itemId,
			playerItemId: item.id,
			name: item.itemName,
			quantity: 1,
		});
	}
	showInventoryModal.value = false;
	onOfferChanged();
}

// タッチ操作のハンドリング
let touchStartY = 0;
let touchStartTime = 0;
const SCROLL_THRESHOLD = 10;
const TAP_MAX_DURATION = 300;

function handleTouchStart(event: TouchEvent): void {
	if (event.touches.length > 0) {
		touchStartY = event.touches[0].clientY;
		touchStartTime = Date.now();
	}
}

function handleItemTouch(event: TouchEvent, item: InventoryItem): void {
	if (event.changedTouches.length > 0) {
		const touchEndY = event.changedTouches[0].clientY;
		const deltaY = Math.abs(touchEndY - touchStartY);
		const duration = Date.now() - touchStartTime;

		if (deltaY > SCROLL_THRESHOLD || duration > TAP_MAX_DURATION) {
			return;
		}

		toggleItemInOffer(item);
	}
}

// インベントリ読み込み
async function loadInventory(): Promise<void> {
	try {
		const result = await misskeyApi('noctown/item/inventory', {});
		inventory.value = result.items || [];
	} catch (e) {
		console.error('Failed to load inventory:', e);
	}
}

// トレード詳細読み込み
async function loadTradeDetail(tradeId: string): Promise<void> {
	try {
		const result = await misskeyApi('noctown/trade/detail', { tradeId });
		tradeDetail.value = result as TradeDetail;

		// 自分のオファーを反映
		if (amInitiator.value) {
			myBarterOffer.value = tradeDetail.value?.initiatorItems.map(item => ({
				itemId: item.itemId,
				name: item.name,
				quantity: item.quantity,
			})) || [];
			myBarterCurrency.value = tradeDetail.value?.initiatorCurrency || 0;
		} else {
			myBarterOffer.value = tradeDetail.value?.targetItems.map(item => ({
				itemId: item.itemId,
				name: item.name,
				quantity: item.quantity,
			})) || [];
			myBarterCurrency.value = tradeDetail.value?.targetCurrency || 0;
		}
	} catch (e: unknown) {
		console.error('Failed to load trade detail:', e);
		const err = e as { code?: string; message?: string };
		lastError.value = errorMessages[err.code || ''] || 'トレードの読み込みに失敗しました';
	}
}

// プレイヤーID取得
async function fetchMyPlayerId(): Promise<void> {
	try {
		const res = await window.fetch('/api/noctown/player', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});
		if (res.ok) {
			const data = await res.json();
			myPlayerId.value = data.id;
		}
	} catch (e) {
		console.error('Failed to fetch player id:', e);
	}
}

// トレードリクエスト送信
async function sendTradeRequest(): Promise<void> {
	if (!props.targetPlayer || !canSendRequest.value) return;

	isSending.value = true;
	try {
		// 仕様: trade/requestはitemIdを使用（playerItemIdではない）
		await misskeyApi('noctown/trade/request', {
			targetPlayerId: props.targetPlayer.id,
			offeredItems: myOffer.value.map(item => ({
				itemId: item.playerItemId || item.itemId,
				quantity: item.quantity,
			})),
			offeredCurrency: offeredCurrency.value,
		});

		emit('trade-sent');
		emit('close');
	} catch (e: unknown) {
		console.error('Failed to send trade:', e);
		const err = e as { code?: string };
		await os.alert({
			type: 'error',
			title: 'トレードエラー',
			text: errorMessages[err.code || ''] || 'トレードリクエストの送信に失敗しました',
		});
	} finally {
		isSending.value = false;
	}
}

// 仕様: バーター通貨入力ハンドラ（モバイル対応）
function handleBarterCurrencyInput(event: Event): void {
	const input = event.target as HTMLInputElement;
	const value = parseInt(input.value) || 0;
	myBarterCurrency.value = Math.max(0, value);
	onOfferChanged();
}

// オファー変更時の処理（サーバーに同期）
async function onOfferChanged(): Promise<void> {
	if (!tradeDetail.value || tradeDetail.value.status !== 'accepted') return;

	try {
		await misskeyApi('noctown/trade/add-items', {
			tradeId: tradeDetail.value.id,
			items: myBarterOffer.value
				.filter(i => i.playerItemId != null)
				.map(i => ({
					playerItemId: i.playerItemId!,
					quantity: i.quantity,
				})),
			currency: myBarterCurrency.value,
		});
	} catch (e) {
		console.error('Failed to update offer:', e);
	}
}

// 交換OK/解除トグル
async function toggleConfirm(): Promise<void> {
	if (!tradeDetail.value) return;

	isSending.value = true;
	try {
		if (myConfirmed.value) {
			// 仕様: 交換OK解除
			await (misskeyApi as any)('noctown/trade/unconfirm', { tradeId: tradeDetail.value.id });
		} else {
			// 仕様: 交換OK
			await misskeyApi('noctown/trade/confirm', { tradeId: tradeDetail.value.id });
		}
		// 詳細を再読み込み
		await loadTradeDetail(tradeDetail.value.id);
	} catch (e: unknown) {
		console.error('Failed to toggle confirm:', e);
		const err = e as { code?: string };
		await os.alert({
			type: 'error',
			title: 'トレードエラー',
			text: errorMessages[err.code || ''] || '操作に失敗しました',
		});
	} finally {
		isSending.value = false;
	}
}

// 仕様: 交換実行（両者がconfirmed状態の時のみ）
// アラートはtradeCompletedイベントハンドラで表示するため、ここでは表示しない
async function executeTrade(): Promise<void> {
	if (!tradeDetail.value) return;

	isSending.value = true;
	try {
		await (misskeyApi as any)('noctown/trade/execute', { tradeId: tradeDetail.value.id });
		// 仕様: 成功時のアラートはWebSocketのtradeCompletedイベントで表示される
		// ここではemitとcloseを行わない（イベントハンドラに任せる）
	} catch (e: unknown) {
		console.error('Failed to execute trade:', e);
		const err = e as { code?: string };
		await os.alert({
			type: 'error',
			title: '交換失敗',
			text: errorMessages[err.code || ''] || '交換が行われませんでした',
		});
	} finally {
		isSending.value = false;
	}
}

// トレードキャンセル
async function cancelTrade(): Promise<void> {
	if (!tradeDetail.value) return;

	isSending.value = true;
	try {
		await misskeyApi('noctown/trade/cancel', { tradeId: tradeDetail.value.id });
		emit('close');
	} catch (e: unknown) {
		console.error('Failed to cancel trade:', e);
		const err = e as { code?: string };
		await os.alert({
			type: 'error',
			title: 'トレードエラー',
			text: errorMessages[err.code || ''] || 'キャンセルに失敗しました',
		});
	} finally {
		isSending.value = false;
	}
}

// パネルを閉じる（トレードキャンセルも同時に行う）
function handleClose(): void {
	if (tradeDetail.value && (tradeDetail.value.status === 'pending' || tradeDetail.value.status === 'accepted')) {
		// 進行中のトレードをキャンセル
		cancelTrade();
	} else {
		emit('close');
	}
}

// 再読み込み
async function retryLoad(): Promise<void> {
	lastError.value = null;
	isLoading.value = true;
	if (props.initialTradeId) {
		await loadTradeDetail(props.initialTradeId);
	}
	isLoading.value = false;
}

// 仕様: WebSocketイベント設定
function setupWebSocket(): void {
	stream = useStream();
	channel = stream.useChannel('noctown') as any;

	// 仕様: トレードアイテム変更イベント（型はnoctownチャンネル固有なのでas anyでキャスト）
	(channel as any).on('tradeItemsChanged', (body: {
		tradeId: string;
		items: Array<{ itemId: string; itemName: string; quantity: number }>;
		currency: number;
		isFromInitiator: boolean;
	}) => {
		if (tradeDetail.value && tradeDetail.value.id === body.tradeId) {
			// 相手のオファーを更新
			if ((amInitiator.value && !body.isFromInitiator) || (!amInitiator.value && body.isFromInitiator)) {
				// これは相手からの変更
				if (body.isFromInitiator) {
					tradeDetail.value.initiatorItems = body.items.map(i => ({
						itemId: i.itemId,
						name: i.itemName,
						quantity: i.quantity,
					}));
					tradeDetail.value.initiatorCurrency = body.currency;
				} else {
					tradeDetail.value.targetItems = body.items.map(i => ({
						itemId: i.itemId,
						name: i.itemName,
						quantity: i.quantity,
					}));
					tradeDetail.value.targetCurrency = body.currency;
				}
			}
		}
	});

	// 仕様: 相手が交換OKを押した
	(channel as any).on('tradeConfirmed', (body: { tradeId: string; confirmedBy: string }) => {
		if (tradeDetail.value && tradeDetail.value.id === body.tradeId) {
			if (body.confirmedBy === 'initiator') {
				tradeDetail.value.initiatorConfirmed = true;
			} else {
				tradeDetail.value.targetConfirmed = true;
			}
		}
	});

	// 仕様: 確認リセット（アイテム変更による）
	(channel as any).on('tradeConfirmReset', (body: { tradeId: string; resetBy: string }) => {
		if (tradeDetail.value && tradeDetail.value.id === body.tradeId) {
			// 両者のconfirmedをリセット
			tradeDetail.value.initiatorConfirmed = false;
			tradeDetail.value.targetConfirmed = false;
		}
	});

	// 仕様: トレード完了（アラートはここで1回だけ表示）
	(channel as any).on('tradeCompleted', (body: { tradeId: string }) => {
		if (tradeDetail.value && tradeDetail.value.id === body.tradeId) {
			os.alert({
				type: 'success',
				title: 'トレード完了',
				text: 'アイテムと通貨の交換が完了しました',
			});
			emit('trade-completed');
			emit('close');
		}
	});

	// 仕様: トレードキャンセル
	(channel as any).on('tradeCancelled', (body: { tradeId: string; reason?: string }) => {
		if (tradeDetail.value && tradeDetail.value.id === body.tradeId) {
			const message = body.reason === 'disconnected'
				? '相手が切断しました'
				: '相手がトレードをキャンセルしました';
			os.alert({
				type: 'warning',
				title: 'トレードキャンセル',
				text: message,
			});
			emit('close');
		}
	});
}

// 初期化
onMounted(async () => {
	isLoading.value = true;
	lastError.value = null;

	try {
		await fetchMyPlayerId();
		await loadInventory();

		if (props.initialTradeId) {
			await loadTradeDetail(props.initialTradeId);
		}

		setupWebSocket();
	} catch (e: unknown) {
		console.error('Failed to initialize:', e);
		const err = e as { message?: string };
		lastError.value = err.message || '初期化に失敗しました';
	} finally {
		isLoading.value = false;
	}
});

// initialTradeIdが変更された場合
watch(() => props.initialTradeId, async (newId) => {
	if (newId) {
		isLoading.value = true;
		await loadTradeDetail(newId);
		isLoading.value = false;
	}
});

onUnmounted(() => {
	if (channel) {
		channel.dispose();
		channel = null;
	}
});

// 外部から呼び出し可能なメソッド
defineExpose({
	refreshTrades: async () => {
		if (tradeDetail.value) {
			await loadTradeDetail(tradeDetail.value.id);
		}
	},
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: 600px;
	max-height: 80vh;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	overflow: hidden;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.title {
	margin: 0;
	font-size: 18px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.closeBtn {
	background: none;
	border: none;
	padding: 8px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	&:hover {
		opacity: 1;
	}
}

.loading, .error, .fallback {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
	text-align: center;

	i {
		font-size: 48px;
		margin-bottom: 12px;
		opacity: 0.5;
	}

	p {
		margin: 0 0 16px 0;
		opacity: 0.8;
	}
}

.error i {
	color: #ef4444;
}

.retryBtn, .historyBtn {
	padding: 10px 20px;
	background: var(--MI_THEME-accent);
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
}

.requestMode, .barterMode {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.playerInfo, .partnerInfo {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
}

.avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
}

.avatarPlaceholder {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--MI_THEME-divider);
	display: flex;
	align-items: center;
	justify-content: center;
}

// 2カラムレイアウト
.tradeColumns, .barterColumns {
	display: flex;
	gap: 16px;
	margin-bottom: 16px;
}

.column, .barterColumn {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	padding: 12px;

	&.locked {
		opacity: 0.7;
		background: var(--MI_THEME-divider);
	}
}

.columnTitle {
	margin: 0 0 12px 0;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.confirmedBadge {
	margin-left: auto;
	padding: 2px 8px;
	background: #22c55e;
	color: white;
	border-radius: 10px;
	font-size: 11px;
	font-weight: 600;
}

.itemList, .offerList, .offerDisplay {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-height: 120px;
	max-height: 200px;
}

.emptyMessage {
	text-align: center;
	color: var(--MI_THEME-fg);
	opacity: 0.5;
	padding: 20px;
}

.itemCard {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	min-height: 44px;
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.selected {
		background: var(--MI_THEME-accentedBg);
		border: 1px solid var(--MI_THEME-accent);
	}
}

.displayItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 10px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
}

.offerItem {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
}

.itemName {
	flex: 1;
	font-size: 13px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.itemQty {
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	font-size: 12px;
}

.quantityInput {
	width: 50px;
	padding: 4px 8px;
	text-align: center;
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 4px;
	color: var(--MI_THEME-fg);
}

/* 仕様: 削除ボタン（モバイルでタップしやすいサイズ） */
.removeBtn {
	background: none;
	border: none;
	padding: 8px;
	min-width: 32px;
	min-height: 32px;
	cursor: pointer;
	color: #ef4444;
	opacity: 0.7;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover, &:active {
		opacity: 1;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 4px;
	}
}

.addItemBtn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px;
	margin-top: 8px;
	background: transparent;
	border: 2px dashed var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	&:hover {
		opacity: 1;
		border-color: var(--MI_THEME-accent);
	}
}

.currencySection {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--MI_THEME-divider);

	label {
		display: flex;
		align-items: center;
		gap: 4px;
	}
}

/* 仕様: 通貨入力（font-size: 16px以上でiOSズーム防止） */
.currencyInput {
	width: 100px;
	padding: 8px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	font-size: 16px;
	-webkit-appearance: none;
	-moz-appearance: textfield;
}

.currencyDisplay {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 8px 10px;
	color: #f59e0b;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
}

.statusBadge {
	display: inline-block;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	margin-bottom: 12px;

	&.pending {
		background: #fbbf24;
		color: #000;
	}

	&.accepted {
		background: #3b82f6;
		color: #fff;
	}
}

.exchangeSection {
	margin: 16px 0;
	text-align: center;
}

.actionButtons {
	display: flex;
	gap: 12px;
	margin-top: 16px;
}

.actionBtn {
	flex: 1;
	padding: 12px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	transition: opacity 0.15s;

	&:hover:not(.disabled) {
		opacity: 0.9;
	}

	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&.primary {
		background: var(--MI_THEME-accent);
		color: white;
	}

	&.success {
		background: #22c55e;
		color: white;
	}

	&.warning {
		background: #f59e0b;
		color: white;
	}

	&.danger {
		background: #ef4444;
		color: white;
	}

	&.exchange {
		background: linear-gradient(135deg, #22c55e, #3b82f6);
		color: white;
		font-size: 16px;
		padding: 16px;
	}
}

// モーダル
.modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modalContent {
	width: 90%;
	max-width: 350px;
	max-height: 400px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	overflow: hidden;
}

.modalHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);

	button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--MI_THEME-fg);
	}
}

.modalBody {
	padding: 12px;
	max-height: 300px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>
