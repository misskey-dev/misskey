<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.header">
		<h2 :class="$style.title">
			<i class="ti ti-arrows-exchange"></i>
			トレード
		</h2>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<!-- Trade with specific player -->
	<div v-if="targetPlayer" :class="$style.tradeWith">
		<div :class="$style.playerInfo">
			<img
				v-if="targetPlayer.avatarUrl"
				:src="targetPlayer.avatarUrl"
				:class="$style.avatar"
			/>
			<div v-else :class="$style.avatarPlaceholder">
				<i class="ti ti-user"></i>
			</div>
			<span>{{ targetPlayer.username }}</span>
		</div>

		<!-- My offer -->
		<div :class="$style.section">
			<h3>自分のオファー</h3>
			<div :class="$style.offerList">
				<div
					v-for="(item, index) in myOffer"
					:key="index"
					:class="$style.offerItem"
				>
					<span>{{ item.name }}</span>
					<span :class="$style.quantity">x{{ item.quantity }}</span>
					<button :class="$style.removeBtn" @click="removeFromOffer(index)">
						<i class="ti ti-x"></i>
					</button>
				</div>
				<button :class="$style.addBtn" @click="showItemSelector = true">
					<i class="ti ti-plus"></i>
					アイテムを追加
				</button>
			</div>

			<!-- Currency offer -->
			<div :class="$style.currencyInput">
				<label>
					<i class="ti ti-coin"></i>
					通貨:
				</label>
				<input
					v-model.number="offeredCurrency"
					type="number"
					min="0"
					:class="$style.input"
				/>
			</div>
		</div>

		<!-- Message -->
		<div :class="$style.section">
			<h3>メッセージ (任意)</h3>
			<textarea
				v-model="message"
				:class="$style.textarea"
				placeholder="取引についてのメッセージ..."
				maxlength="200"
			></textarea>
		</div>

		<!-- Send button -->
		<button
			:class="[$style.sendBtn, !canSendTrade && $style.disabled]"
			:disabled="!canSendTrade || isSending"
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

	<!-- Trade Detail View (Barter Mode) -->
	<div v-else-if="selectedTradeId && tradeDetail" :class="$style.tradeDetail">
		<button :class="$style.backBtn" @click="closeTradeDetail">
			<i class="ti ti-arrow-left"></i>
			戻る
		</button>

		<div v-if="isLoadingDetail" :class="$style.loading">
			<MkLoading/>
		</div>

		<template v-else>
			<!-- Trade Status -->
			<div :class="[$style.statusBadge, $style[tradeDetail.status]]">
				{{ tradeDetail.status === 'pending' ? '承認待ち' : tradeDetail.status === 'accepted' ? '交渉中' : tradeDetail.status }}
			</div>

			<!-- Initiator's Offer -->
			<div :class="$style.offerSection">
				<h3>{{ tradeDetail.initiatorUsername }}のオファー</h3>
				<div :class="$style.itemsList">
					<div v-for="item in tradeDetail.initiatorItems" :key="item.itemId" :class="$style.itemRow">
						<span>{{ item.name }}</span>
						<span :class="$style.qty">x{{ item.quantity }}</span>
					</div>
					<div v-if="tradeDetail.initiatorCurrency > 0" :class="$style.currencyRow">
						<i class="ti ti-coin"></i>
						{{ tradeDetail.initiatorCurrency }}G
					</div>
					<div v-if="tradeDetail.initiatorItems.length === 0 && tradeDetail.initiatorCurrency === 0" :class="$style.noItems">
						アイテムなし
					</div>
				</div>
				<div v-if="tradeDetail.initiatorConfirmed" :class="$style.confirmed">
					<i class="ti ti-check"></i> 確認済み
				</div>
			</div>

			<!-- Exchange Arrow -->
			<div :class="$style.exchangeArrow">
				<i class="ti ti-arrows-exchange"></i>
			</div>

			<!-- Target's Offer -->
			<div :class="$style.offerSection">
				<h3>{{ tradeDetail.targetUsername }}のオファー</h3>
				<div :class="$style.itemsList">
					<div v-for="item in tradeDetail.targetItems" :key="item.itemId" :class="$style.itemRow">
						<span>{{ item.name }}</span>
						<span :class="$style.qty">x{{ item.quantity }}</span>
					</div>
					<div v-if="tradeDetail.targetCurrency > 0" :class="$style.currencyRow">
						<i class="ti ti-coin"></i>
						{{ tradeDetail.targetCurrency }}G
					</div>
					<div v-if="tradeDetail.targetItems.length === 0 && tradeDetail.targetCurrency === 0" :class="$style.noItems">
						アイテムなし
					</div>
				</div>
				<div v-if="tradeDetail.targetConfirmed" :class="$style.confirmed">
					<i class="ti ti-check"></i> 確認済み
				</div>
			</div>

			<!-- Add Counter Offer (if accepted and not confirmed) -->
			<div v-if="tradeDetail.status === 'accepted'" :class="$style.counterOfferSection">
				<h3>カウンターオファーを追加</h3>
				<div :class="$style.counterItems">
					<div v-for="(item, index) in myCounterOffer" :key="index" :class="$style.counterItem">
						<span>{{ item.name }}</span>
						<span :class="$style.qty">x{{ item.quantity }}</span>
						<button :class="$style.removeBtn" @click="removeFromCounterOffer(index)">
							<i class="ti ti-x"></i>
						</button>
					</div>
					<button :class="$style.addBtn" @click="showInventorySelector = true">
						<i class="ti ti-plus"></i>
						アイテム追加
					</button>
				</div>
				<div :class="$style.currencyInput">
					<label>
						<i class="ti ti-coin"></i>
						通貨:
					</label>
					<input v-model.number="myCounterCurrency" type="number" min="0" :class="$style.input"/>
				</div>
			</div>

			<!-- Inventory Selector Modal -->
			<div v-if="showInventorySelector" :class="$style.inventoryModal">
				<div :class="$style.inventoryHeader">
					<span>インベントリから選択</span>
					<button @click="showInventorySelector = false">
						<i class="ti ti-x"></i>
					</button>
				</div>
				<div :class="$style.inventoryGrid">
					<div
						v-for="item in inventory"
						:key="item.id"
						:class="$style.inventoryItem"
						@click="addItemToCounterOffer(item)"
					>
						<span>{{ item.itemName }}</span>
						<span :class="$style.qty">x{{ item.quantity }}</span>
					</div>
				</div>
			</div>

			<!-- Message -->
			<div v-if="tradeDetail.message" :class="$style.messageBox">
				<i class="ti ti-message"></i>
				{{ tradeDetail.message }}
			</div>

			<!-- Actions -->
			<div :class="$style.detailActions">
				<button
					:class="[$style.confirmBtn, (!canConfirmTrade || isSending) && $style.disabled]"
					:disabled="!canConfirmTrade || isSending"
					@click="addItemsAndConfirm"
				>
					<template v-if="isSending">
						<MkLoading :em="true"/>
					</template>
					<template v-else>
						<i class="ti ti-check"></i>
						確認して取引
					</template>
				</button>
				<button :class="$style.cancelBtn" @click="cancelTrade(tradeDetail.id)">
					キャンセル
				</button>
			</div>
		</template>
	</div>

	<!-- Trade list -->
	<div v-else :class="$style.tradeList">
		<div v-if="isLoading" :class="$style.loading">
			<MkLoading/>
		</div>

		<template v-else>
			<!-- Pending trades (received) -->
			<div v-if="pendingTrades.length > 0" :class="$style.tradeSection">
				<h3>受信したトレード</h3>
				<div
					v-for="trade in pendingTrades"
					:key="trade.id"
					:class="$style.tradeItem"
				>
					<div :class="$style.tradeInfo">
						<span :class="$style.tradeName">{{ trade.otherPlayerName }}</span>
						<span :class="$style.tradeDetails">
							{{ trade.itemCount }}アイテム
							<template v-if="trade.currencyRequested > 0">
								+ {{ trade.currencyRequested }}G
							</template>
						</span>
					</div>
					<div :class="$style.tradeActions">
						<button :class="$style.acceptBtn" @click="respondToTradeRequest(trade.id, 'accept')">
							<i class="ti ti-check"></i>
						</button>
						<button :class="$style.rejectBtn" @click="respondToTradeRequest(trade.id, 'decline')">
							<i class="ti ti-x"></i>
						</button>
					</div>
				</div>
			</div>

			<!-- Accepted trades (in negotiation) -->
			<div v-if="acceptedTrades.length > 0" :class="$style.tradeSection">
				<h3>交渉中のトレード</h3>
				<div
					v-for="trade in acceptedTrades"
					:key="trade.id"
					:class="[$style.tradeItem, $style.clickable]"
					@click="loadTradeDetail(trade.id)"
				>
					<div :class="$style.tradeInfo">
						<span :class="$style.tradeName">{{ trade.otherPlayerName }}</span>
						<span :class="$style.tradeDetails">
							{{ trade.itemCount }}アイテム - タップして詳細
						</span>
					</div>
					<i class="ti ti-chevron-right"></i>
				</div>
			</div>

			<!-- Sent trades (waiting) -->
			<div v-if="sentTrades.length > 0" :class="$style.tradeSection">
				<h3>送信したトレード</h3>
				<div
					v-for="trade in sentTrades"
					:key="trade.id"
					:class="$style.tradeItem"
				>
					<div :class="$style.tradeInfo">
						<span :class="$style.tradeName">{{ trade.otherPlayerName }}</span>
						<span :class="[$style.statusLabel, $style.pendingLabel]">
							<i class="ti ti-clock"></i>
							承認待ち
						</span>
					</div>
					<button :class="$style.cancelBtn" @click="cancelTrade(trade.id)">
						キャンセル
					</button>
				</div>
			</div>

			<!-- Declined trades -->
			<div v-if="declinedTrades.length > 0" :class="$style.tradeSection">
				<h3>拒否されたトレード</h3>
				<div
					v-for="trade in declinedTrades"
					:key="trade.id"
					:class="$style.tradeItem"
				>
					<div :class="$style.tradeInfo">
						<span :class="$style.tradeName">{{ trade.otherPlayerName }}</span>
						<span :class="[$style.statusLabel, $style.declinedLabel]">
							<i class="ti ti-x"></i>
							拒否されました
						</span>
					</div>
				</div>
			</div>

			<!-- Empty state -->
			<div v-if="pendingTrades.length === 0 && sentTrades.length === 0 && acceptedTrades.length === 0 && declinedTrades.length === 0" :class="$style.empty">
				<i class="ti ti-arrows-exchange"></i>
				<p>アクティブなトレードはありません</p>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

interface TradeItem {
	itemId: string;
	playerItemId?: string;
	name: string;
	quantity: number;
}

interface Trade {
	id: string;
	otherPlayerName: string;
	otherPlayerId: string;
	isInitiator: boolean;
	status: string;
	itemCount: number;
	currencyOffered: number;
	currencyRequested: number;
	message: string | null;
	initiatorConfirmed?: boolean;
	targetConfirmed?: boolean;
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
	acquiredAt: string;
}

const props = defineProps<{
	targetPlayer?: PlayerData | null;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'trade-sent'): void;
	(e: 'trade-completed'): void;
}>();

const isLoading = ref(true);
const isSending = ref(false);
const pendingTrades = ref<Trade[]>([]);
const sentTrades = ref<Trade[]>([]);
const acceptedTrades = ref<Trade[]>([]);
// 仕様: 最近拒否されたトレード（5分以内）
const declinedTrades = ref<Trade[]>([]);
const myOffer = ref<TradeItem[]>([]);
const offeredCurrency = ref(0);
const message = ref('');
const showItemSelector = ref(false);
const selectedTradeId = ref<string | null>(null);
const tradeDetail = ref<TradeDetail | null>(null);
const isLoadingDetail = ref(false);
const myCounterOffer = ref<TradeItem[]>([]);
const myCounterCurrency = ref(0);
const inventory = ref<InventoryItem[]>([]);
const showInventorySelector = ref(false);

const canSendTrade = computed(() => {
	return (myOffer.value.length > 0 || offeredCurrency.value > 0) && !isSending.value;
});

const canConfirmTrade = computed(() => {
	if (!tradeDetail.value) return false;
	// Both parties can confirm once trade is accepted
	return tradeDetail.value.status === 'accepted';
});

const myConfirmStatus = computed(() => {
	if (!tradeDetail.value) return false;
	// Determine which confirmation applies to current user
	// This would need playerId from context - simplified for now
	return tradeDetail.value.initiatorConfirmed || tradeDetail.value.targetConfirmed;
});

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function loadTrades(): Promise<void> {
	isLoading.value = true;

	try {
		const result = await misskeyApi('noctown/trade/list', {});
		const trades = result.trades || [];

		// 仕様: トレードを種類別に分類
		// - 受信: 相手からのpendingトレード
		// - 送信: 自分からのpendingトレード
		// - 交渉中: acceptedトレード
		// - 拒否: declinedトレード（5分以内）
		pendingTrades.value = trades.filter((t: Trade) => t.status === 'pending' && !t.isInitiator);
		sentTrades.value = trades.filter((t: Trade) => t.status === 'pending' && t.isInitiator);
		acceptedTrades.value = trades.filter((t: Trade) => t.status === 'accepted');
		declinedTrades.value = trades.filter((t: Trade) => t.status === 'declined' && t.isInitiator);
	} catch (e) {
		console.error('Failed to load trades:', e);
		pendingTrades.value = [];
		sentTrades.value = [];
		acceptedTrades.value = [];
		declinedTrades.value = [];
	} finally {
		isLoading.value = false;
	}
}

async function loadTradeDetail(tradeId: string): Promise<void> {
	isLoadingDetail.value = true;
	selectedTradeId.value = tradeId;

	try {
		const result = await misskeyApi('noctown/trade/detail', { tradeId });
		tradeDetail.value = result as TradeDetail;
	} catch (e) {
		console.error('Failed to load trade detail:', e);
		tradeDetail.value = null;
	} finally {
		isLoadingDetail.value = false;
	}
}

async function loadInventory(): Promise<void> {
	try {
		const result = await misskeyApi('noctown/item/inventory', {});
		inventory.value = (result as InventoryItem[]) || [];
	} catch (e) {
		console.error('Failed to load inventory:', e);
	}
}

function closeTradeDetail(): void {
	selectedTradeId.value = null;
	tradeDetail.value = null;
	myCounterOffer.value = [];
	myCounterCurrency.value = 0;
}

function addItemToCounterOffer(item: InventoryItem): void {
	const existing = myCounterOffer.value.find(i => i.itemId === item.itemId);
	if (existing) {
		if (existing.quantity < item.quantity) {
			existing.quantity++;
		}
	} else {
		myCounterOffer.value.push({
			itemId: item.itemId,
			playerItemId: item.id,
			name: item.itemName,
			quantity: 1,
		});
	}
	showInventorySelector.value = false;
}

function removeFromCounterOffer(index: number): void {
	myCounterOffer.value.splice(index, 1);
}

async function respondToTradeRequest(tradeId: string, response: 'accept' | 'decline'): Promise<void> {
	try {
		await misskeyApi('noctown/trade/respond', { tradeId, response });

		if (response === 'accept') {
			// Load trade detail for adding counter items
			await loadTradeDetail(tradeId);
			await loadInventory();
		} else {
			await loadTrades();
		}
	} catch (e) {
		console.error('Failed to respond to trade:', e);
	}
}

async function addItemsAndConfirm(): Promise<void> {
	if (!tradeDetail.value) return;

	isSending.value = true;
	try {
		// Add counter offer items if any
		if (myCounterOffer.value.length > 0 || myCounterCurrency.value > 0) {
			await misskeyApi('noctown/trade/add-items', {
				tradeId: tradeDetail.value.id,
				items: myCounterOffer.value
					.filter(i => i.playerItemId != null)
					.map(i => ({
						playerItemId: i.playerItemId!,
						quantity: i.quantity,
					})),
				currency: myCounterCurrency.value,
			});
		}

		// Confirm the trade
		await misskeyApi('noctown/trade/confirm', { tradeId: tradeDetail.value.id });

		// Reload to check if completed
		await loadTradeDetail(tradeDetail.value.id);

		if (tradeDetail.value?.status === 'completed') {
			emit('trade-completed');
			closeTradeDetail();
			await loadTrades();
		}
	} catch (e) {
		console.error('Failed to confirm trade:', e);
	} finally {
		isSending.value = false;
	}
}

function removeFromOffer(index: number): void {
	myOffer.value.splice(index, 1);
}

async function sendTradeRequest(): Promise<void> {
	if (!props.targetPlayer || !canSendTrade.value) return;

	isSending.value = true;

	try {
		await misskeyApi('noctown/trade/barter', {
			targetPlayerId: props.targetPlayer.id,
			offeredItems: myOffer.value.map(item => ({
				playerItemId: item.playerItemId || item.itemId,
				quantity: item.quantity,
			})),
			offeredCurrency: offeredCurrency.value,
			message: message.value || null,
		});

		emit('trade-sent');
		emit('close');
	} catch (e) {
		console.error('Failed to send trade:', e);
	} finally {
		isSending.value = false;
	}
}

async function confirmTrade(tradeId: string): Promise<void> {
	try {
		const result = await misskeyApi('noctown/trade/confirm', { tradeId });

		if (result.status === 'completed') {
			emit('trade-completed');
		}

		await loadTrades();
	} catch (e) {
		console.error('Failed to confirm trade:', e);
	}
}

async function cancelTrade(tradeId: string): Promise<void> {
	try {
		await misskeyApi('noctown/trade/cancel', { tradeId });

		if (selectedTradeId.value === tradeId) {
			closeTradeDetail();
		}

		await loadTrades();
	} catch (e) {
		console.error('Failed to cancel trade:', e);
	}
}

onMounted(() => {
	if (!props.targetPlayer) {
		loadTrades();
	} else {
		isLoading.value = false;
	}
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	height: 100%;
	max-height: 600px;
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

.tradeWith {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.playerInfo {
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

.section {
	margin-bottom: 16px;

	h3 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: var(--MI_THEME-fg);
		opacity: 0.7;
	}
}

.offerList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.offerItem {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
}

.quantity {
	margin-left: auto;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.removeBtn {
	background: none;
	border: none;
	padding: 4px;
	cursor: pointer;
	color: #ef4444;
	opacity: 0.6;

	&:hover {
		opacity: 1;
	}
}

.addBtn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px;
	background: var(--MI_THEME-bg);
	border: 2px dashed var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	transition: all 0.15s;

	&:hover {
		opacity: 1;
		border-color: var(--MI_THEME-accent);
	}
}

.currencyInput {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;

	label {
		display: flex;
		align-items: center;
		gap: 4px;
	}
}

.input {
	width: 100px;
	padding: 8px;
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
}

.textarea {
	width: 100%;
	min-height: 80px;
	padding: 10px;
	background: var(--MI_THEME-bg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	resize: vertical;
}

.sendBtn {
	width: 100%;
	padding: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: var(--MI_THEME-accent);
	border: none;
	border-radius: 8px;
	cursor: pointer;
	color: white;
	font-size: 15px;
	font-weight: 600;
	transition: opacity 0.15s;

	&:hover:not(.disabled) {
		opacity: 0.9;
	}
}

.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.tradeList {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.loading, .empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	i {
		font-size: 48px;
		margin-bottom: 8px;
	}
}

.tradeSection {
	margin-bottom: 20px;

	h3 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: var(--MI_THEME-fg);
		opacity: 0.7;
	}
}

.tradeItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	margin-bottom: 8px;
}

.tradeInfo {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.tradeName {
	font-weight: 600;
}

.tradeDetails {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.tradeActions {
	display: flex;
	gap: 8px;
}

.acceptBtn, .rejectBtn {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: opacity 0.15s;

	&:hover {
		opacity: 0.8;
	}
}

.acceptBtn {
	background: #22c55e;
	color: white;
}

.rejectBtn {
	background: #ef4444;
	color: white;
}

.cancelBtn {
	padding: 6px 12px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	font-size: 13px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.clickable {
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.tradeDetail {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.backBtn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: none;
	border: none;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	margin-bottom: 16px;

	&:hover {
		opacity: 0.7;
	}
}

.statusBadge {
	display: inline-block;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	margin-bottom: 16px;

	&.pending {
		background: #fbbf24;
		color: #000;
	}

	&.accepted {
		background: #3b82f6;
		color: #fff;
	}

	&.completed {
		background: #22c55e;
		color: #fff;
	}
}

.offerSection {
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 12px;

	h3 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: var(--MI_THEME-fg);
		opacity: 0.8;
	}
}

.itemsList {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.itemRow, .currencyRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
}

.currencyRow {
	color: #f59e0b;
	gap: 4px;
	justify-content: flex-start;
}

.qty {
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	font-size: 12px;
}

.noItems {
	color: var(--MI_THEME-fg);
	opacity: 0.4;
	font-size: 12px;
	padding: 8px;
	text-align: center;
}

.confirmed {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-top: 8px;
	color: #22c55e;
	font-size: 12px;
}

.exchangeArrow {
	display: flex;
	justify-content: center;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.4;
	font-size: 24px;
}

.counterOfferSection {
	background: var(--MI_THEME-accentedBg);
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 12px;

	h3 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: var(--MI_THEME-fg);
	}
}

.counterItems {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.counterItem {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
}

.inventoryModal {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 90%;
	max-width: 300px;
	max-height: 400px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	z-index: 100;
}

.inventoryHeader {
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

.inventoryGrid {
	padding: 12px;
	max-height: 300px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.inventoryItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.messageBox {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	margin-bottom: 16px;
	font-size: 13px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
}

.detailActions {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.confirmBtn {
	width: 100%;
	padding: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: #22c55e;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	color: white;
	font-size: 15px;
	font-weight: 600;
	transition: opacity 0.15s;

	&:hover:not(.disabled) {
		opacity: 0.9;
	}
}

// 仕様: トレードステータスラベル（背景色あり、ゆっくり点滅）
.statusLabel {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
}

.pendingLabel {
	background: rgba(251, 191, 36, 0.2);
	color: #f59e0b;
	animation: pulse-pending 2s ease-in-out infinite;
}

.declinedLabel {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
	animation: pulse-declined 2s ease-in-out infinite;
}

@keyframes pulse-pending {
	0%, 100% {
		opacity: 1;
		background: rgba(251, 191, 36, 0.2);
	}
	50% {
		opacity: 0.6;
		background: rgba(251, 191, 36, 0.35);
	}
}

@keyframes pulse-declined {
	0%, 100% {
		opacity: 1;
		background: rgba(239, 68, 68, 0.2);
	}
	50% {
		opacity: 0.6;
		background: rgba(239, 68, 68, 0.35);
	}
}
</style>
