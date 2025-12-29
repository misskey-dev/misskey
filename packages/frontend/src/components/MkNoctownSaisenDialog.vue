<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
 * 仕様: T034 賽銭ダイアログコンポーネント
 * プリセット金額ボタン（5, 10, 100, 500）でワンタップ奉納
 * カスタム金額入力も可能
 * 現在の残高と累計賽銭額を表示
 -->

<template>
<MkModal ref="modal" @click="$emit('close')" @closed="$emit('closed')">
	<div :class="$style.root">
		<div :class="$style.header">
			<span :class="$style.title">お賽銭</span>
			<button :class="$style.closeBtn" @click="$emit('close')">
				<i class="ti ti-x"></i>
			</button>
		</div>

		<div :class="$style.body">
			<!-- 残高表示 -->
			<div :class="$style.balanceSection">
				<div :class="$style.balanceLabel">現在の残高</div>
				<div :class="$style.balanceValue">
					<i class="ti ti-coin"></i>
					{{ balance.toLocaleString() }} ノクタコイン
				</div>
			</div>

			<!-- プリセット金額ボタン -->
			<div :class="$style.presetButtons">
				<button
					v-for="amount in presetAmounts"
					:key="amount"
					:class="[$style.presetBtn, { [$style.presetBtnDisabled]: amount > balance }]"
					:disabled="amount > balance || isProcessing"
					@click="offerSaisen(amount)"
				>
					{{ amount }} コイン
				</button>
			</div>

			<!-- カスタム金額入力 -->
			<div :class="$style.customSection">
				<label :class="$style.customLabel">カスタム金額</label>
				<div :class="$style.customInputRow">
					<input
						v-model.number="customAmount"
						type="number"
						min="1"
						:max="balance"
						:class="$style.customInput"
						placeholder="1"
						:disabled="isProcessing"
					/>
					<button
						:class="[$style.customBtn, { [$style.customBtnDisabled]: !isCustomAmountValid }]"
						:disabled="!isCustomAmountValid || isProcessing"
						@click="customAmount !== null && offerSaisen(customAmount)"
					>
						奉納
					</button>
				</div>
				<div v-if="customAmountError" :class="$style.error">
					{{ customAmountError }}
				</div>
			</div>

			<!-- 累計賽銭情報 -->
			<div :class="$style.statsSection">
				<div :class="$style.statItem">
					<span :class="$style.statLabel">累計奉納額</span>
					<span :class="$style.statValue">{{ totalSaisen.toLocaleString() }} コイン</span>
				</div>
				<div :class="$style.statItem">
					<span :class="$style.statLabel">次のマイルストーンまで</span>
					<span :class="$style.statValue">{{ remainingToMilestone.toLocaleString() }} コイン</span>
				</div>
				<div :class="$style.milestone">
					<div
						:class="$style.milestoneProgress"
						:style="{ width: milestoneProgress + '%' }"
					></div>
				</div>
			</div>

			<!-- 処理中インジケータ -->
			<div v-if="isProcessing" :class="$style.processing">
				<MkLoading/>
			</div>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'closed'): void;
	(e: 'offer', amount: number): void;
}>();

// State
const balance = ref(0);
const totalSaisen = ref(0);
const nextMilestone = ref(500);
const remainingToMilestone = ref(500);
const customAmount = ref<number | null>(null);
const isProcessing = ref(false);

// Constants
const presetAmounts = [5, 10, 100, 500];

// Computed
const customAmountError = computed(() => {
	if (customAmount.value === null) return null;
	if (!Number.isInteger(customAmount.value)) return '整数を入力してください';
	if (customAmount.value < 1) return '1以上を入力してください';
	if (customAmount.value > balance.value) return '残高が不足しています';
	return null;
});

const isCustomAmountValid = computed(() => {
	if (customAmount.value === null) return false;
	return Number.isInteger(customAmount.value) &&
		customAmount.value >= 1 &&
		customAmount.value <= balance.value;
});

const milestoneProgress = computed(() => {
	const currentInMilestone = totalSaisen.value % 500;
	return (currentInMilestone / 500) * 100;
});

// Methods
async function fetchData(): Promise<void> {
	try {
		// 残高取得
		const walletRes = await misskeyApi('noctown/player') as { balance: string };
		balance.value = parseInt(walletRes.balance ?? '0', 10);

		// 賽銭履歴取得（累計情報用）
		const historyRes = await misskeyApi('noctown/saisen/history' as 'i', { limit: 1 }) as {
			totalSaisen: number;
			nextMilestone: number;
			remainingToMilestone: number;
		};
		totalSaisen.value = historyRes.totalSaisen;
		nextMilestone.value = historyRes.nextMilestone;
		remainingToMilestone.value = historyRes.remainingToMilestone;
	} catch (error) {
		console.error('[MkNoctownSaisenDialog] Failed to fetch data:', error);
	}
}

async function offerSaisen(amount: number): Promise<void> {
	if (isProcessing.value) return;
	if (amount === null) return;

	isProcessing.value = true;

	try {
		const result = await misskeyApi('noctown/saisen/offer' as 'i', { amount }) as {
			success: boolean;
			mochiCount: number;
			milestonesCrossed: number[];
			newBalance: number;
			totalSaisen: number;
		};

		// 成功通知
		os.toast(
			result.mochiCount > 0
				? `お賽銭を奉納しました！鏡餅を ${result.mochiCount}個 手に入れた！`
				: 'お賽銭を奉納しました！',
		);

		// 状態更新
		balance.value = result.newBalance;
		totalSaisen.value = result.totalSaisen;
		const currentMilestone = Math.floor(result.totalSaisen / 500) * 500;
		nextMilestone.value = currentMilestone + 500;
		remainingToMilestone.value = nextMilestone.value - result.totalSaisen;

		// WebSocket経由でも通知（親コンポーネントで処理）
		emit('offer', amount);
	} catch (error: unknown) {
		const err = error as { code?: string; message?: string };
		if (err.code === 'INSUFFICIENT_BALANCE') {
			os.alert({
				type: 'error',
				title: '残高不足',
				text: '残高が不足しています。',
			});
		} else if (err.code === 'NOT_IN_SHRINE_WORLD') {
			os.alert({
				type: 'error',
				title: '神社ワールド限定',
				text: 'お賽銭は神社ワールドでのみ行えます。',
			});
		} else {
			os.alert({
				type: 'error',
				title: 'エラー',
				text: err.message ?? '奉納に失敗しました。',
			});
		}
	} finally {
		isProcessing.value = false;
	}
}

// Lifecycle
onMounted(() => {
	fetchData();
});
</script>

<style lang="scss" module>
.root {
	width: 350px;
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	background: linear-gradient(135deg, #ff6b6b, #ff8e53);
	color: white;
}

.title {
	font-size: 18px;
	font-weight: bold;
}

.closeBtn {
	background: none;
	border: none;
	color: white;
	font-size: 18px;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
}

.body {
	padding: 16px;
}

.balanceSection {
	text-align: center;
	margin-bottom: 20px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
}

.balanceLabel {
	font-size: 12px;
	color: var(--MI_THEME-fgTransparent);
	margin-bottom: 4px;
}

.balanceValue {
	font-size: 20px;
	font-weight: bold;
	color: #fbbf24;

	i {
		margin-right: 4px;
	}
}

.presetButtons {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
	margin-bottom: 20px;
}

.presetBtn {
	padding: 14px;
	font-size: 16px;
	font-weight: bold;
	background: linear-gradient(135deg, #ff6b6b, #ff8e53);
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: transform 0.1s, box-shadow 0.2s;

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
}

.presetBtnDisabled {
	background: var(--MI_THEME-bgSecondary);
	color: var(--MI_THEME-fgTransparent);
	cursor: not-allowed;
}

.customSection {
	margin-bottom: 20px;
}

.customLabel {
	display: block;
	font-size: 12px;
	color: var(--MI_THEME-fgTransparent);
	margin-bottom: 8px;
}

.customInputRow {
	display: flex;
	gap: 10px;
}

.customInput {
	flex: 1;
	padding: 12px;
	font-size: 16px;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	outline: none;

	&:focus {
		border-color: #ff6b6b;
	}
}

.customBtn {
	padding: 12px 20px;
	font-size: 14px;
	font-weight: bold;
	background: linear-gradient(135deg, #ff6b6b, #ff8e53);
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: opacity 0.2s;
}

.customBtnDisabled {
	background: var(--MI_THEME-bgSecondary);
	color: var(--MI_THEME-fgTransparent);
	cursor: not-allowed;
}

.error {
	margin-top: 8px;
	font-size: 12px;
	color: #f87171;
}

.statsSection {
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	padding: 12px;
}

.statItem {
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;

	&:last-of-type {
		margin-bottom: 12px;
	}
}

.statLabel {
	font-size: 12px;
	color: var(--MI_THEME-fgTransparent);
}

.statValue {
	font-size: 14px;
	font-weight: bold;
}

.milestone {
	height: 8px;
	background: var(--MI_THEME-bgSecondary);
	border-radius: 4px;
	overflow: hidden;
}

.milestoneProgress {
	height: 100%;
	background: linear-gradient(90deg, #ff6b6b, #fbbf24);
	border-radius: 4px;
	transition: width 0.3s ease;
}

.processing {
	display: flex;
	justify-content: center;
	padding: 20px;
}
</style>
