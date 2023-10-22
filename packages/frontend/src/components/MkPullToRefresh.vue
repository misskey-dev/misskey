<template>
	<div ref="rootEl" :class="$style.root">
		<div v-if="isPullStart" :class="$style.frame" :style="`--frame-min-height: ${currentHeight}px;`">
			<div :class="$style.contents">
				<i v-if="!isRefreshing" :class="['ti', 'ti-arrow-bar-to-down', { [$style.refresh]: isPullEnd }]"></i>
				<MkLoading v-else :em="true"/>
				<p v-if="isPullEnd">{{ i18n.ts.releaseToRefresh }}</p>
				<p v-else-if="isRefreshing">{{ i18n.ts.refreshing }}</p>
				<p v-else>{{ i18n.ts.pullDownToRefresh }}</p>
			</div>
		</div>
		<slot />
	</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { deviceKind } from '@/scripts/device-kind.js';
import { i18n } from '@/i18n.js';

let isPullStart = $ref(false);
let isPullEnd = $ref(false);
let isRefreshing = $ref(false);

const scrollStop = 10;
const maxFrameSize = 75;
const refreshFrameSize = 65;
const fixTimeMs = 200;
let currentHeight = $ref(0);

let supportPointerDesktop = false;
let startScreenY: number | null = null;

const rootEl = $shallowRef<HTMLDivElement>();
let scrollEl: HTMLElement | null = null;

let disabled = false;

const emits = defineEmits<{
	(e: 'refresh'): void;
}>();

const getScrollableParentElement = (node) => {
	if (node == null) {
		return null;
	}

	if (node.scrollHeight > node.clientHeight) {
		return node;
	}
	else {
		return getScrollableParentElement(node.parentNode);
	}
};

const getScreenY = (event) => {
	if (supportPointerDesktop) {
		return event.screenY;
	}
	return event.touches[0].screenY;
};

const moveStart = (e) => {
	if (!isPullStart && !isRefreshing && !disabled) {
		isPullStart = true;
		startScreenY = getScreenY(e);
		currentHeight = 0;
	}
};

const moveBySystem = (to: number): Promise<void> => new Promise(r => {
	const startHeight = currentHeight;
	const overHeight = currentHeight - to;
	if (overHeight < 1) {
		r();
		return;
	}
	const startTime = Date.now();
	let intervalId = setInterval(() => {
		const time = Date.now() - startTime;
		if (time > fixTimeMs) {
			currentHeight = to;
			clearInterval(intervalId);
			r();
			return;
		}
		const nextHeight = startHeight - (overHeight / fixTimeMs) * time;
		if (currentHeight < nextHeight) return;
		currentHeight = nextHeight;
	}, 1);
});

const fixOverContent = async () => {
	if (currentHeight > refreshFrameSize) {
		await moveBySystem(refreshFrameSize);
	}
};

const closeContent = async () => {
	if (currentHeight > 0) {
		await moveBySystem(0);
	}
};

const moveEnd = () => {
	if (isPullStart && !isRefreshing) {
		startScreenY = null;
		if (isPullEnd) {
			isPullEnd = false;
			isRefreshing = true;
			fixOverContent().then(() => emits('refresh'));
		}
		else {
			closeContent().then(() => isPullStart = false);
		}
	}
};

const moving = (e) => {
	if (!isPullStart || isRefreshing || disabled) return;

	if (!scrollEl) {
		scrollEl = getScrollableParentElement(rootEl);
	}
	if ((scrollEl?.scrollTop ?? 0) > (supportPointerDesktop ? scrollStop : scrollStop + currentHeight)) {
		currentHeight = 0;
		isPullEnd = false;
		moveEnd();
		return;
	}

	if (startScreenY === null) {
		startScreenY = getScreenY(e);
	}
	const moveScreenY = getScreenY(e);

	const moveHeight = moveScreenY - startScreenY!;
	if (moveHeight < 0) {
		currentHeight = 0;
	}
	else if (moveHeight >= maxFrameSize) {
		currentHeight = maxFrameSize;
	}
	else {
		currentHeight = moveHeight;
	}

	isPullEnd = currentHeight >= refreshFrameSize;
};

onMounted(() => {
	supportPointerDesktop = !!window.PointerEvent && deviceKind === 'desktop';

	if (supportPointerDesktop) {
		rootEl.addEventListener('pointerdown', moveStart);
		rootEl.addEventListener('pointerup', moveEnd);
		rootEl.addEventListener('pointermove', moving, {passive: true});
	}
	else {
		rootEl.addEventListener('touchstart', moveStart);
		rootEl.addEventListener('touchend', moveEnd);
		rootEl.addEventListener('touchmove', moving, {passive: true});
	}
});

/**
 * emit(refresh)が完了したことを知らせる関数
 * 
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
const refreshFinished = () => {
	closeContent().then(() => {
		isPullStart = false;
		isRefreshing = false;
	});
};

const setDisabled = (value) => {
	disabled = value;
};

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

		box-shadow: inset 0px -7px 10px -10px rgba(0,0,0,.1);
		mask-image: linear-gradient(90deg, #000 0%, #000 80%, transparent);
		-webkit-mask-image: -webkit-linear-gradient(90deg, #000 0%, #000 80%, transparent);

		pointer-events: none;

		> .contents {
			position: absolute;

			bottom: 0;
			width: 100%;

			margin: 5px 0;

			display: flex;
			flex-direction: column;
			align-items: center;

			margin: 5px 0;

			font-size: 14px;

			> i, > div {
				margin: 6px 0;
			}
			> i {
				transition: transform .25s;

				&.refresh {
					transform: rotate(180deg);
				}
			}

			> p {
				margin: 5px 0;
			}
		}
	}
</style>
