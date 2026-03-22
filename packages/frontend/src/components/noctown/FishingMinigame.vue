<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	:width="400"
	:height="500"
	@close="cancel"
	@closed="cancel"
>
	<template #header>
		<i class="ti ti-fish"></i> 釣り
	</template>

	<div :class="$style.container">
		<!-- Waiting state -->
		<template v-if="state === 'waiting'">
			<div :class="$style.waitingArea">
				<div :class="$style.fishingAnimation">
					<div :class="$style.rod"></div>
					<div :class="$style.line"></div>
					<div :class="$style.bobber" :style="{ animationDuration: `${bobberSpeed}s` }"></div>
				</div>
				<p :class="$style.waitingText">魚がかかるのを待っています...</p>
				<p :class="$style.waitingHint">魚がかかったらすぐにボタンを押そう!</p>
			</div>
		</template>

		<!-- Fish hooked state -->
		<template v-else-if="state === 'hooked'">
			<div :class="$style.hookedArea">
				<div :class="$style.fishingAnimation">
					<div :class="$style.rod"></div>
					<div :class="$style.line"></div>
					<div :class="[$style.bobber, $style.hookedBobber]"></div>
					<div :class="$style.splash"></div>
				</div>
				<p :class="$style.hookedText">魚がかかった!</p>
				<MkButton :class="$style.catchButton" primary @click="attemptCatch">
					<i class="ti ti-fish-hook"></i> 釣り上げる!
				</MkButton>
				<div :class="$style.timer">
					<div :class="$style.timerBar" :style="{ width: `${timerProgress}%` }"></div>
				</div>
			</div>
		</template>

		<!-- Catching state -->
		<template v-else-if="state === 'catching'">
			<div :class="$style.catchingArea">
				<MkLoading />
				<p :class="$style.catchingText">釣り上げ中...</p>
			</div>
		</template>

		<!-- Result state -->
		<template v-else-if="state === 'result'">
			<div :class="$style.resultArea">
				<template v-if="catchResult">
					<div :class="[$style.resultIcon, $style[`rarity${catchResult.item.rarity}`]]">
						<i class="ti ti-fish"></i>
					</div>
					<h3 :class="[$style.itemName, $style[`rarity${catchResult.item.rarity}`]]">
						{{ catchResult.item.name }}
					</h3>
					<p :class="$style.itemRarity">
						{{ getRarityName(catchResult.item.rarity) }}
					</p>
					<p v-if="catchResult.item.flavorText" :class="$style.itemFlavor">
						"{{ catchResult.item.flavorText }}"
					</p>
					<p :class="$style.message">{{ catchResult.message }}</p>
				</template>
				<template v-else>
					<div :class="[$style.resultIcon, $style.failed]">
						<i class="ti ti-fish-off"></i>
					</div>
					<h3 :class="$style.failedText">{{ failMessage }}</h3>
				</template>
				<MkButton @click="close">閉じる</MkButton>
			</div>
		</template>

		<!-- Cancel button for waiting state -->
		<div v-if="state === 'waiting'" :class="$style.cancelArea">
			<MkButton @click="cancel">キャンセル</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

type FishingState = 'waiting' | 'hooked' | 'catching' | 'result';

interface CatchResult {
	success: boolean;
	caught: boolean;
	item: {
		id: string;
		name: string;
		rarity: number;
		flavorText: string | null;
	};
	message: string;
}

const props = defineProps<{
	pondX: number;
	pondZ: number;
	waitTime: number;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'caught', item: CatchResult['item']): void;
}>();

const state = ref<FishingState>('waiting');
const catchResult = ref<CatchResult | null>(null);
const failMessage = ref('');
const timerProgress = ref(100);
const bobberSpeed = ref(2);

// Timers
let hookTimer: ReturnType<typeof window.setTimeout> | null = null;
let catchWindowTimer: ReturnType<typeof window.setTimeout> | null = null;
let timerInterval: ReturnType<typeof window.setInterval> | null = null;

// Catch window duration (must match backend)
const CATCH_WINDOW_MS = 2000;

// Rarity names
const rarityNames: Record<number, string> = {
	0: 'ノーマル',
	1: 'レア',
	2: 'スーパーレア',
	3: 'SSレア',
	4: 'ウルトラレア',
	5: 'レジェンダリー',
};

function getRarityName(rarity: number): string {
	return rarityNames[rarity] ?? 'ノーマル';
}

async function startFishing() {
	state.value = 'waiting';
	bobberSpeed.value = 2;

	// Wait for fish to bite
	hookTimer = window.setTimeout(() => {
		onFishHooked();
	}, props.waitTime);
}

function onFishHooked() {
	state.value = 'hooked';
	timerProgress.value = 100;
	bobberSpeed.value = 0.3;

	// Start countdown for catch window
	const startTime = Date.now();
	timerInterval = window.setInterval(() => {
		const elapsed = Date.now() - startTime;
		timerProgress.value = Math.max(0, 100 - (elapsed / CATCH_WINDOW_MS) * 100);
	}, 50);

	// Auto-fail if player doesn't click in time
	catchWindowTimer = window.setTimeout(() => {
		if (state.value === 'hooked') {
			onCatchFailed('too_late');
		}
	}, CATCH_WINDOW_MS);
}

async function attemptCatch() {
	if (state.value !== 'hooked') return;

	// Clear timers
	clearTimers();

	state.value = 'catching';

	try {
		const result = await misskeyApi('noctown/fishing/catch', {});
		catchResult.value = result as CatchResult;
		state.value = 'result';

		if (result.caught && result.item) {
			emit('caught', result.item);
		}
	} catch (e: any) {
		state.value = 'result';
		catchResult.value = null;

		if (e.code === 'TOO_EARLY') {
			failMessage.value = '早すぎた! 魚はまだ来ていない...';
		} else if (e.code === 'TOO_LATE') {
			failMessage.value = '遅すぎた! 魚に逃げられた...';
		} else if (e.code === 'NOT_FISHING') {
			failMessage.value = '釣りセッションが終了しました';
		} else {
			failMessage.value = '釣りに失敗しました';
		}
	}
}

function onCatchFailed(reason: 'too_early' | 'too_late') {
	clearTimers();
	state.value = 'result';
	catchResult.value = null;

	if (reason === 'too_early') {
		failMessage.value = '早すぎた! 魚はまだ来ていない...';
	} else {
		failMessage.value = '遅すぎた! 魚に逃げられた...';
	}
}

function clearTimers() {
	if (hookTimer) {
		window.clearTimeout(hookTimer);
		hookTimer = null;
	}
	if (catchWindowTimer) {
		window.clearTimeout(catchWindowTimer);
		catchWindowTimer = null;
	}
	if (timerInterval) {
		window.clearInterval(timerInterval);
		timerInterval = null;
	}
}

function cancel() {
	clearTimers();
	emit('close');
}

function close() {
	clearTimers();
	emit('close');
}

onMounted(() => {
	startFishing();
});

onUnmounted(() => {
	clearTimers();
});
</script>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 20px;
	gap: 16px;
}

.waitingArea, .hookedArea, .catchingArea, .resultArea {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	flex: 1;
}

.fishingAnimation {
	position: relative;
	width: 150px;
	height: 200px;
}

.rod {
	position: absolute;
	top: 0;
	left: 50%;
	width: 8px;
	height: 100px;
	background: linear-gradient(to bottom, #8b4513, #a0522d);
	border-radius: 4px;
	transform: translateX(-50%) rotate(-30deg);
	transform-origin: bottom center;
}

.line {
	position: absolute;
	top: 90px;
	left: 55%;
	width: 2px;
	height: 80px;
	background: #888;
}

.bobber {
	position: absolute;
	top: 160px;
	left: 52%;
	width: 16px;
	height: 20px;
	background: linear-gradient(to bottom, #ff4444, #fff);
	border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
	animation: bobberFloat 2s ease-in-out infinite;
}

.hookedBobber {
	animation: bobberHooked 0.3s ease-in-out infinite !important;
}

.splash {
	position: absolute;
	top: 155px;
	left: 40%;
	width: 40px;
	height: 10px;
	background: radial-gradient(ellipse, rgba(255, 255, 255, 0.8), transparent);
	border-radius: 50%;
	animation: splash 0.5s ease-out infinite;
}

@keyframes bobberFloat {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-5px); }
}

@keyframes bobberHooked {
	0%, 100% { transform: translateY(0) rotate(0deg); }
	25% { transform: translateY(-10px) rotate(-10deg); }
	75% { transform: translateY(-10px) rotate(10deg); }
}

@keyframes splash {
	0% { opacity: 1; transform: scale(1); }
	100% { opacity: 0; transform: scale(2); }
}

.waitingText {
	font-size: 18px;
	font-weight: 600;
	color: var(--MI_THEME-fg);
}

.waitingHint {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.hookedText {
	font-size: 24px;
	font-weight: bold;
	color: #ff6b35;
	animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.1); }
}

.catchButton {
	font-size: 18px;
	padding: 12px 32px;
}

.timer {
	width: 200px;
	height: 8px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;
	overflow: hidden;
}

.timerBar {
	height: 100%;
	background: linear-gradient(to right, #ff6b35, #ffc107);
	transition: width 0.05s linear;
}

.catchingText {
	font-size: 16px;
	color: var(--MI_THEME-fg);
}

.resultIcon {
	width: 80px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	font-size: 40px;
	color: white;
	margin-bottom: 8px;

	&.rarity0 { background: #8b8b8b; }
	&.rarity1 { background: #2ecc71; }
	&.rarity2 { background: #3498db; }
	&.rarity3 { background: #9b59b6; }
	&.rarity4 { background: #f39c12; }
	&.rarity5 { background: linear-gradient(135deg, #e74c3c, #f39c12, #f1c40f); }
	&.failed { background: #666; }
}

.itemName {
	font-size: 24px;
	font-weight: bold;
	margin: 0;

	&.rarity0 { color: #8b8b8b; }
	&.rarity1 { color: #2ecc71; }
	&.rarity2 { color: #3498db; }
	&.rarity3 { color: #9b59b6; }
	&.rarity4 { color: #f39c12; }
	&.rarity5 { color: #e74c3c; }
}

.itemRarity {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	margin: 0;
}

.itemFlavor {
	font-size: 14px;
	font-style: italic;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	text-align: center;
	max-width: 300px;
	margin: 8px 0;
}

.message {
	font-size: 16px;
	color: var(--MI_THEME-fg);
	margin-bottom: 16px;
}

.failedText {
	font-size: 20px;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	margin-bottom: 16px;
}

.cancelArea {
	margin-top: auto;
}
</style>
