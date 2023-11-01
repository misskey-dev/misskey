<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<div v-if="isPullStart" :class="$style.frame" :style="`--frame-min-height: ${pullDistance / (PULL_BRAKE_BASE + (pullDistance / PULL_BRAKE_FACTOR))}px;`">
		<div :class="$style.frameContent">
			<MkLoading v-if="isRefreshing" :class="$style.loader" :em="true"/>
			<i v-else class="ti ti-arrow-bar-to-down" :class="[$style.icon, { [$style.refresh]: isPullEnd }]"></i>
			<div :class="$style.text">
				<template v-if="isPullEnd">{{ i18n.ts.releaseToRefresh }}</template>
				<template v-else-if="isRefreshing">{{ i18n.ts.refreshing }}</template>
				<template v-else>{{ i18n.ts.pullDownToRefresh }}</template>
			</div>
		</div>
	</div>
	<div :class="{ [$style.slotClip]: isPullStart }">
		<slot/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { deviceKind } from '@/scripts/device-kind.js';
import { i18n } from '@/i18n.js';

const SCROLL_STOP = 10;
const MAX_PULL_DISTANCE = Infinity;
const FIRE_THRESHOLD = 230;
const RELEASE_TRANSITION_DURATION = 200;
const PULL_BRAKE_BASE = 2;
const PULL_BRAKE_FACTOR = 200;

let isPullStart = $ref(false);
let isPullEnd = $ref(false);
let isRefreshing = $ref(false);
let pullDistance = $ref(0);

let supportPointerDesktop = false;
let startScreenY: number | null = null;

const rootEl = $shallowRef<HTMLDivElement>();
let scrollEl: HTMLElement | null = null;

let disabled = false;

const emits = defineEmits<{
	(ev: 'refresh'): void;
}>();

function getScrollableParentElement(node) {
	if (node == null) {
		return null;
	}

	if (node.scrollHeight > node.clientHeight) {
		return node;
	} else {
		return getScrollableParentElement(node.parentNode);
	}
}

function getScreenY(event) {
	if (supportPointerDesktop) {
		return event.screenY;
	}
	return event.touches[0].screenY;
}

function moveStart(event) {
	if (!isPullStart && !isRefreshing && !disabled) {
		isPullStart = true;
		startScreenY = getScreenY(event);
		pullDistance = 0;
	}
}

function moveBySystem(to: number): Promise<void> {
	return new Promise(r => {
		const startHeight = pullDistance;
		const overHeight = pullDistance - to;
		if (overHeight < 1) {
			r();
			return;
		}
		const startTime = Date.now();
		let intervalId = setInterval(() => {
			const time = Date.now() - startTime;
			if (time > RELEASE_TRANSITION_DURATION) {
				pullDistance = to;
				clearInterval(intervalId);
				r();
				return;
			}
			const nextHeight = startHeight - (overHeight / RELEASE_TRANSITION_DURATION) * time;
			if (pullDistance < nextHeight) return;
			pullDistance = nextHeight;
		}, 1);
	});
}

async function fixOverContent() {
	if (pullDistance > FIRE_THRESHOLD) {
		await moveBySystem(FIRE_THRESHOLD);
	}
}

async function closeContent() {
	if (pullDistance > 0) {
		await moveBySystem(0);
	}
}

function moveEnd() {
	if (isPullStart && !isRefreshing) {
		startScreenY = null;
		if (isPullEnd) {
			isPullEnd = false;
			isRefreshing = true;
			fixOverContent().then(() => emits('refresh'));
		} else {
			closeContent().then(() => isPullStart = false);
		}
	}
}

function moving(event) {
	if (!isPullStart || isRefreshing || disabled) return;

	if (!scrollEl) {
		scrollEl = getScrollableParentElement(rootEl);
	}
	if ((scrollEl?.scrollTop ?? 0) > (supportPointerDesktop ? SCROLL_STOP : SCROLL_STOP + pullDistance)) {
		pullDistance = 0;
		isPullEnd = false;
		moveEnd();
		return;
	}

	if (startScreenY === null) {
		startScreenY = getScreenY(event);
	}
	const moveScreenY = getScreenY(event);

	const moveHeight = moveScreenY - startScreenY!;
	pullDistance = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);

	isPullEnd = pullDistance >= FIRE_THRESHOLD;
}

/**
 * emit(refresh)が完了したことを知らせる関数
 *
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
function refreshFinished() {
	closeContent().then(() => {
		isPullStart = false;
		isRefreshing = false;
	});
}

function setDisabled(value) {
	disabled = value;
}

onMounted(() => {
	// マウス操作でpull to refreshするのは不便そう
	//supportPointerDesktop = !!window.PointerEvent && deviceKind === 'desktop';

	if (supportPointerDesktop) {
		rootEl.addEventListener('pointerdown', moveStart);
		// ポインターの場合、ポップアップ系の動作をするとdownだけ発火されてupが発火されないため
		window.addEventListener('pointerup', moveEnd);
		rootEl.addEventListener('pointermove', moving, { passive: true });
	} else {
		rootEl.addEventListener('touchstart', moveStart);
		rootEl.addEventListener('touchend', moveEnd);
		rootEl.addEventListener('touchmove', moving, { passive: true });
	}
});

onUnmounted(() => {
	if (supportPointerDesktop) window.removeEventListener('pointerup', moveEnd);
});

defineExpose({
	refreshFinished,
	setDisabled,
});
</script>

<style lang="scss" module>
.frame {
	position: relative;
	overflow: clip;

	width: 100%;
	min-height: var(--frame-min-height, 0px);

	mask-image: linear-gradient(90deg, #000 0%, #000 80%, transparent);
	-webkit-mask-image: -webkit-linear-gradient(90deg, #000 0%, #000 80%, transparent);

	pointer-events: none;
}

.frameContent {
	position: absolute;
	bottom: 0;
	width: 100%;
	margin: 5px 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	font-size: 14px;

	> .icon, > .loader {
		margin: 6px 0;
	}

	> .icon {
		transition: transform .25s;

		&.refresh {
			transform: rotate(180deg);
		}
	}

	> .text {
		margin: 5px 0;
	}
}

.slotClip {
	overflow-y: clip;
}
</style>
