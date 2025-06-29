<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	name="x"
	:enterActiveClass="prefer.s.animation ? $style.transition_x_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_x_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_x_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_x_leaveTo : ''"
	:duration="300" appear @afterLeave="onClosed"
>
	<div v-show="showing" :class="[$style.root]" :style="{ zIndex }">
		<div :class="[$style.bg]" :style="{ zIndex }"></div>
		<div :class="[$style.content]" :style="{ zIndex }">
			<div :class="$style.header">
				<button :class="$style.back" class="_button" @click="closePage"><i class="ti ti-chevron-left"></i></button>
				<div :id="`v-${pageId}-header`" :class="$style.title"></div>
				<div :class="$style.spacer"></div>
			</div>
			<div :id="`v-${pageId}-body`"></div>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { claimZIndex } from '@/os.js';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	pageId: number,
}>(), {
	pageId: 0,
});

const emit = defineEmits<{
	(_: 'closed'): void
}>();

const zIndex = claimZIndex('low');
const showing = ref(true);

function closePage() {
	showing.value = false;
}

function onClosed() {
	emit('closed');
}

</script>

<style lang="scss" module>
.transition_x_enterActive {
	> .bg {
		transition: opacity 0.3s !important;
	}

	> .content {
		transition: transform 0.3s cubic-bezier(0,0,.25,1) !important;
	}
}
.transition_x_leaveActive {
	> .bg {
		transition: opacity 0.3s !important;
	}

	> .content {
		transition: transform 0.3s cubic-bezier(0,0,.25,1) !important;
	}
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		transform: translateX(100%);
	}
}

.root {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: clip;
}

.bg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: var(--MI_THEME-modalBg);
}

.content {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	padding-bottom: env(safe-area-inset-bottom, 0px);
	margin: auto;
	background: var(--MI_THEME-bg);
	container-type: size;
	overflow: auto;
	overscroll-behavior: contain;
}

.header {
	--height: 48px;

	position: sticky;
	top: 0;
	left: 0;
	height: var(--height);
	z-index: 1;
	display: flex;
	align-items: center;
	background: color(from var(--MI_THEME-panel) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.back {
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--height);
	height: var(--height);
	font-size: 16px;
	color: var(--MI_THEME-accent);
}

.title {
	margin: 0 auto;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

.spacer {
	width: var(--height);
	height: var(--height);
}
</style>
