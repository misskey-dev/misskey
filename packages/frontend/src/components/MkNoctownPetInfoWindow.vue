<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
FR-023: ペット情報フローティングウィンドウ
- ペットをクリック/タップすると表示
- 名前、種類（牛/鶏）、飼い主名、マルコフ連鎖フレーバーテキストを表示
-->

<template>
<div :class="$style.overlay" @click.self="handleClose" @keydown.escape="handleClose" tabindex="-1" ref="overlayRef">
	<div :class="$style.window">
		<button :class="$style.closeButton" @click="handleClose">
			<i class="ti ti-x"></i>
		</button>

		<div :class="$style.content">
			<!-- Pet Icon -->
			<div :class="$style.iconWrapper">
				<i :class="[petIcon, $style.icon]"></i>
			</div>

			<!-- Pet Name (shown if not empty) -->
			<div v-if="name" :class="$style.name">{{ name }}</div>

			<!-- Pet Type -->
			<div :class="$style.type">{{ petTypeLabel }}</div>

			<!-- Owner info -->
			<div :class="$style.ownerInfo">
				<span :class="$style.ownerLabel">Owned by:</span>
				<span :class="$style.ownerName">{{ ownerName || 'Unknown' }}</span>
			</div>

			<!-- Flavor Text (FR-024: マルコフ連鎖フレーバーテキスト) -->
			<div :class="$style.flavorText">
				"{{ flavorText }}"
			</div>

			<!-- Status bars (optional, only shown if available) -->
			<div v-if="hunger !== undefined && happiness !== undefined" :class="$style.statusSection">
				<div :class="$style.statusRow">
					<span :class="$style.statusLabel"><i class="ti ti-meat"></i> Hunger</span>
					<div :class="$style.statusBar">
						<div :class="[$style.statusFill, $style.hungerFill]" :style="{ width: `${hunger}%` }"></div>
					</div>
					<span :class="$style.statusValue">{{ hunger }}%</span>
				</div>
				<div :class="$style.statusRow">
					<span :class="$style.statusLabel"><i class="ti ti-heart"></i> Happy</span>
					<div :class="$style.statusBar">
						<div :class="[$style.statusFill, $style.happyFill]" :style="{ width: `${happiness}%` }"></div>
					</div>
					<span :class="$style.statusValue">{{ happiness }}%</span>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
	petId: string;
	type: 'cow' | 'chicken';
	name: string | null;
	ownerName: string | null;
	flavorText: string;
	hunger?: number;
	happiness?: number;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);

// ペットアイコン
const petIcon = computed(() => {
	// Tabler iconsにはcow/chickenがないので代替アイコンを使用
	return props.type === 'cow' ? 'ti ti-pig' : 'ti ti-feather';
});

// ペットタイプのラベル
const petTypeLabel = computed(() => {
	return props.type === 'cow' ? 'Cow' : 'Chicken';
});

function handleClose() {
	emit('close');
}

onMounted(() => {
	overlayRef.value?.focus();
});
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	outline: none;
}

.window {
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	padding: 24px;
	min-width: 300px;
	max-width: 90vw;
	position: relative;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.closeButton {
	position: absolute;
	top: 8px;
	right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	border-radius: 50%;
	transition: background 0.15s, opacity 0.15s;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}

.iconWrapper {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: var(--MI_THEME-bg);
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon {
	font-size: 40px;
	color: var(--MI_THEME-accent);
}

.name {
	font-size: 20px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.type {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	padding: 4px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 12px;
}

.ownerInfo {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
}

.ownerLabel {
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	font-size: 13px;
}

.ownerName {
	color: var(--MI_THEME-accent);
	font-weight: 500;
	font-size: 14px;
}

.flavorText {
	font-style: italic;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
	text-align: center;
	padding: 12px 16px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	margin-top: 8px;
	line-height: 1.5;
	font-size: 14px;
}

.statusSection {
	width: 100%;
	margin-top: 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.statusRow {
	display: flex;
	align-items: center;
	gap: 8px;
}

.statusLabel {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	min-width: 70px;
	display: flex;
	align-items: center;
	gap: 4px;
}

.statusBar {
	flex: 1;
	height: 8px;
	background: var(--MI_THEME-bg);
	border-radius: 4px;
	overflow: hidden;
}

.statusFill {
	height: 100%;
	border-radius: 4px;
	transition: width 0.3s ease;
}

.hungerFill {
	background: linear-gradient(90deg, #ff8844, #ff4444);
}

.happyFill {
	background: linear-gradient(90deg, #44ff88, #44cc44);
}

.statusValue {
	font-size: 12px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	min-width: 40px;
	text-align: right;
}
</style>
