<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
 * 仕様: T021 ワープエフェクトコンポーネント
 * ワープ開始時に画面全体にフラッシュエフェクトを表示
 * アニメーション完了後にワールド切り替えを実行
 -->

<template>
<Transition name="warp-flash" @after-leave="onAnimationComplete">
	<div v-if="active" class="warp-effect-overlay">
		<div class="warp-vortex"></div>
		<div class="warp-flash"></div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{
	active: boolean;
}>();

const emit = defineEmits<{
	(e: 'animationComplete'): void;
}>();

function onAnimationComplete(): void {
	emit('animationComplete');
}
</script>

<style lang="scss" scoped>
.warp-effect-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	z-index: 10000;
	pointer-events: none;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
}

.warp-vortex {
	position: absolute;
	width: 200vmax;
	height: 200vmax;
	border-radius: 50%;
	background: radial-gradient(
		circle,
		rgba(102, 153, 255, 0.8) 0%,
		rgba(102, 153, 255, 0.4) 30%,
		rgba(102, 153, 255, 0.1) 60%,
		transparent 100%
	);
	animation: vortex-spin 0.8s ease-in-out;
}

.warp-flash {
	position: absolute;
	width: 100vw;
	height: 100vh;
	background: white;
	animation: flash-effect 0.8s ease-in-out;
}

@keyframes vortex-spin {
	0% {
		transform: scale(0) rotate(0deg);
		opacity: 0;
	}
	50% {
		transform: scale(0.5) rotate(180deg);
		opacity: 1;
	}
	100% {
		transform: scale(2) rotate(360deg);
		opacity: 0;
	}
}

@keyframes flash-effect {
	0% {
		opacity: 0;
	}
	40% {
		opacity: 0;
	}
	60% {
		opacity: 1;
	}
	100% {
		opacity: 1;
	}
}

/* Transition effects */
.warp-flash-enter-active {
	animation: warp-in 0.8s ease-in-out;
}

.warp-flash-leave-active {
	animation: warp-out 0.3s ease-out;
}

@keyframes warp-in {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

@keyframes warp-out {
	0% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}
</style>
