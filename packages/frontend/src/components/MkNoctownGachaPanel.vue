<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-gift"></i>
		<span>ガチャ</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div :class="$style.content">
		<div v-if="loading" :class="$style.loading">
			<MkLoading/>
		</div>
		<div v-else-if="gachas.length === 0" :class="$style.empty">
			利用可能なガチャはありません
		</div>
		<div v-else :class="$style.gachaList">
			<div
				v-for="gacha in gachas"
				:key="gacha.id"
				:class="[$style.gacha, { [$style.selected]: selectedGacha?.id === gacha.id, [$style.unavailable]: !gacha.isAvailable }]"
				@click="selectGacha(gacha)"
			>
				<div :class="$style.gachaHeader">
					<div :class="$style.gachaName">{{ gacha.name }}</div>
					<div :class="$style.gachaCost">
						<i class="ti ti-coin"></i>
						<span>{{ gacha.costPerPull }}</span>
					</div>
				</div>
				<div v-if="gacha.description" :class="$style.gachaDescription">
					{{ gacha.description }}
				</div>
				<div :class="$style.gachaType">
					<i :class="getGachaTypeIcon(gacha.gachaType)"></i>
					<span>{{ getGachaTypeName(gacha.gachaType) }}</span>
				</div>
				<div v-if="!gacha.isAvailable" :class="$style.unavailableLabel">
					現在利用不可
				</div>
			</div>
		</div>
	</div>
	<div v-if="selectedGacha && selectedGacha.isAvailable" :class="$style.actions">
		<div :class="$style.pullCount">
			<button :class="$style.countBtn" @click="decrementCount" :disabled="pullCount <= 1">
				<i class="ti ti-minus"></i>
			</button>
			<span :class="$style.countValue">{{ pullCount }}</span>
			<button :class="$style.countBtn" @click="incrementCount" :disabled="pullCount >= 10">
				<i class="ti ti-plus"></i>
			</button>
		</div>
		<div :class="$style.totalCost">
			合計: <i class="ti ti-coin"></i> {{ selectedGacha.costPerPull * pullCount }}
		</div>
		<MkButton :class="$style.pullBtn" primary @click="pullGacha" :disabled="pulling">
			<i class="ti ti-gift"></i> ガチャを回す
		</MkButton>
	</div>

	<!-- Pull result overlay -->
	<div v-if="showResult" :class="$style.resultOverlay" @click.self="closeResult">
		<div :class="$style.resultPanel">
			<div :class="$style.resultHeader">
				<span>ガチャ結果</span>
				<button :class="$style.closeBtn" @click="closeResult">
					<i class="ti ti-x"></i>
				</button>
			</div>
			<div :class="$style.resultContent">
				<div v-for="(result, index) in pullResults" :key="index" :class="[$style.resultItem, getRarityClass(result.rarityTier)]">
					<div :class="$style.rarityBadge">
						<span v-for="i in result.rarityTier" :key="i">
							<i class="ti ti-star-filled"></i>
						</span>
					</div>
					<div :class="$style.resultItemName">{{ result.itemName }}</div>
					<div v-if="result.isNew" :class="$style.newBadge">NEW!</div>
					<div v-if="result.isUnique" :class="$style.uniqueBadge">
						<i class="ti ti-sparkles"></i> 限定
					</div>
				</div>
			</div>
			<div :class="$style.resultFooter">
				<span>残高: <i class="ti ti-coin"></i> {{ remainingBalance }}</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, useCssModule } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';

const $style = useCssModule();

interface Gacha {
	id: string;
	name: string;
	description: string | null;
	costPerPull: number;
	gachaType: string;
	isAvailable: boolean;
}

interface PullResult {
	itemId: string;
	itemName: string;
	rarityTier: number;
	isUnique: boolean;
	isNew: boolean;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'pulled', results: PullResult[], remainingBalance: string): void;
}>();

const loading = ref(true);
const pulling = ref(false);
const gachas = ref<Gacha[]>([]);
const selectedGacha = ref<Gacha | null>(null);
const pullCount = ref(1);
const showResult = ref(false);
const pullResults = ref<PullResult[]>([]);
const remainingBalance = ref('0');

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

async function fetchGachas(): Promise<void> {
	try {
		loading.value = true;
		const res = await window.fetch('/api/noctown/gacha/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			const data = await res.json();
			gachas.value = data.gachas ?? [];
		}
	} catch (e) {
		console.error('Failed to fetch gachas:', e);
	} finally {
		loading.value = false;
	}
}

function selectGacha(gacha: Gacha): void {
	if (!gacha.isAvailable) return;
	if (selectedGacha.value?.id === gacha.id) {
		selectedGacha.value = null;
	} else {
		selectedGacha.value = gacha;
		pullCount.value = 1;
	}
}

function incrementCount(): void {
	if (pullCount.value < 10) {
		pullCount.value++;
	}
}

function decrementCount(): void {
	if (pullCount.value > 1) {
		pullCount.value--;
	}
}

function getGachaTypeIcon(type: string): string {
	switch (type) {
		case 'standard': return 'ti ti-box';
		case 'premium': return 'ti ti-diamond';
		case 'limited': return 'ti ti-clock';
		case 'event': return 'ti ti-calendar-event';
		default: return 'ti ti-gift';
	}
}

function getGachaTypeName(type: string): string {
	switch (type) {
		case 'standard': return 'スタンダード';
		case 'premium': return 'プレミアム';
		case 'limited': return '期間限定';
		case 'event': return 'イベント';
		default: return '不明';
	}
}

function getRarityClass(tier: number): string {
	switch (tier) {
		case 1: return $style.rarity1;
		case 2: return $style.rarity2;
		case 3: return $style.rarity3;
		case 4: return $style.rarity4;
		case 5: return $style.rarity5;
		default: return '';
	}
}

async function pullGacha(): Promise<void> {
	if (!selectedGacha.value || pulling.value) return;

	try {
		pulling.value = true;
		const res = await window.fetch('/api/noctown/gacha/pull', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				gachaId: selectedGacha.value.id,
				count: pullCount.value,
			}),
		});

		if (res.ok) {
			const data = await res.json();
			pullResults.value = data.results ?? [data.result];
			remainingBalance.value = data.remainingBalance ?? '0';
			showResult.value = true;
			emit('pulled', pullResults.value, remainingBalance.value);
		} else {
			const error = await res.json();
			console.error('Gacha pull failed:', error);
			// Handle specific errors
			if (error.error?.code === 'INSUFFICIENT_FUNDS') {
				alert('コインが足りません');
			} else if (error.error?.code === 'MAX_PULLS_REACHED') {
				alert('このガチャの上限回数に達しました');
			} else if (error.error?.code === 'NO_ITEMS_AVAILABLE') {
				alert('このガチャに利用可能なアイテムがありません');
			}
		}
	} catch (e) {
		console.error('Failed to pull gacha:', e);
	} finally {
		pulling.value = false;
	}
}

function closeResult(): void {
	showResult.value = false;
	pullResults.value = [];
}

onMounted(() => {
	fetchGachas();
});

defineExpose({
	refresh: fetchGachas,
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	left: 16px;
	top: 60px;
	width: 340px;
	max-height: 500px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	z-index: 100;
}

.header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
}

.closeBtn {
	margin-left: auto;
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.gachaList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.gacha {
	padding: 12px;
	border-radius: 8px;
	background: var(--MI_THEME-bg);
	cursor: pointer;
	transition: background 0.15s;

	&:hover:not(.unavailable) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.selected {
		background: var(--MI_THEME-accentedBg);
		border: 1px solid var(--MI_THEME-accent);
	}

	&.unavailable {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.gachaHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.gachaName {
	font-weight: 600;
	font-size: 14px;
}

.gachaCost {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #ffc107;
	font-size: 13px;
	font-weight: 500;
}

.gachaDescription {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	margin-bottom: 8px;
	line-height: 1.4;
}

.gachaType {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	opacity: 0.7;
}

.unavailableLabel {
	margin-top: 8px;
	font-size: 11px;
	color: #f44336;
	font-weight: 500;
}

.actions {
	padding: 12px;
	border-top: 1px solid var(--MI_THEME-divider);
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.pullCount {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
}

.countBtn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
}

.countValue {
	font-size: 18px;
	font-weight: 600;
	min-width: 32px;
	text-align: center;
}

.totalCost {
	text-align: center;
	font-size: 13px;
	color: #ffc107;
}

.pullBtn {
	width: 100%;
}

.resultOverlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 200;
}

.resultPanel {
	width: 320px;
	max-height: 80vh;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.resultHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
	font-size: 16px;
}

.resultContent {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.resultItem {
	padding: 16px;
	border-radius: 10px;
	background: var(--MI_THEME-bg);
	text-align: center;
	position: relative;
	border: 2px solid transparent;
	transition: transform 0.3s ease;

	&:hover {
		transform: scale(1.02);
	}
}

.rarity1 {
	border-color: #9e9e9e;
	background: linear-gradient(135deg, rgba(158, 158, 158, 0.1), transparent);
}

.rarity2 {
	border-color: #4caf50;
	background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), transparent);
}

.rarity3 {
	border-color: #2196f3;
	background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), transparent);
}

.rarity4 {
	border-color: #9c27b0;
	background: linear-gradient(135deg, rgba(156, 39, 176, 0.15), transparent);
}

.rarity5 {
	border-color: #ff9800;
	background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), transparent);
	box-shadow: 0 0 20px rgba(255, 152, 0, 0.3);
}

.rarityBadge {
	margin-bottom: 8px;
	color: #ffc107;
	font-size: 14px;
}

.resultItemName {
	font-weight: 600;
	font-size: 15px;
	margin-bottom: 6px;
}

.newBadge {
	position: absolute;
	top: 8px;
	right: 8px;
	background: #f44336;
	color: white;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: 4px;
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.7; }
}

.uniqueBadge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	background: linear-gradient(135deg, #ff9800, #ffc107);
	color: white;
	font-size: 11px;
	font-weight: 600;
	padding: 3px 8px;
	border-radius: 4px;
}

.resultFooter {
	padding: 12px 16px;
	border-top: 1px solid var(--MI_THEME-divider);
	text-align: center;
	font-size: 13px;
	color: #ffc107;
}
</style>
