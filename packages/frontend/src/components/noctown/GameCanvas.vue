<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="container"
	:class="$style.container"
	@touchstart="onTouchStart"
	@touchend="onTouchEnd"
	@click="onClick"
>
	<!-- Loading overlay -->
	<div v-if="isLoading" :class="$style.overlay">
		<MkLoading/>
		<p>{{ loadingText }}</p>
	</div>

	<!-- Error overlay -->
	<div v-else-if="error" :class="$style.overlay">
		<i class="ti ti-alert-triangle" :class="$style.errorIcon"></i>
		<p :class="$style.errorText">{{ error }}</p>
		<MkButton @click="$emit('retry')">{{ retryText }}</MkButton>
	</div>

	<!-- Mobile controls -->
	<template v-if="isMobile && !isLoading && !error">
		<VirtualJoystick
			v-if="showJoystick"
			@move="onJoystickMove"
			@stop="onJoystickStop"
		/>
		<ActionButton
			v-if="showActionButton"
			:primaryIcon="actionIcon"
			:primaryLabel="actionLabel"
			:showSecondary="showSecondaryAction"
			:secondaryIcon="secondaryIcon"
			@primary="$emit('action')"
			@secondary="$emit('secondary-action')"
		/>
	</template>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import VirtualJoystick from './VirtualJoystick.vue';
import ActionButton from './ActionButton.vue';
import { deviceKind } from '@/utility/device-kind.js';

const emit = defineEmits<{
	(e: 'ready', container: HTMLElement): void;
	(e: 'retry'): void;
	(e: 'tap', x: number, y: number): void;
	(e: 'joystick-move', x: number, z: number, rotation: number): void;
	(e: 'joystick-stop'): void;
	(e: 'action'): void;
	(e: 'secondary-action'): void;
	(e: 'resize', width: number, height: number): void;
}>();

const props = withDefaults(defineProps<{
	isLoading?: boolean;
	error?: string | null;
	loadingText?: string;
	retryText?: string;
	showJoystick?: boolean;
	showActionButton?: boolean;
	actionIcon?: string;
	actionLabel?: string;
	showSecondaryAction?: boolean;
	secondaryIcon?: string;
}>(), {
	isLoading: false,
	error: null,
	loadingText: 'Loading...',
	retryText: 'Retry',
	showJoystick: true,
	showActionButton: true,
	actionIcon: 'ti ti-hand-grab',
	actionLabel: '',
	showSecondaryAction: true,
	secondaryIcon: 'ti ti-message',
});

const container = ref<HTMLElement | null>(null);
const isMobile = computed(() => deviceKind === 'smartphone' || deviceKind === 'tablet');

// Touch handling for tap-to-move
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
const TAP_THRESHOLD = 200; // ms
const MOVE_THRESHOLD = 10; // px

function onTouchStart(e: TouchEvent): void {
	if (e.touches.length === 1) {
		touchStartTime = Date.now();
		touchStartPos = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		};
	}
}

function onTouchEnd(e: TouchEvent): void {
	if (e.changedTouches.length === 1) {
		const touch = e.changedTouches[0];
		const duration = Date.now() - touchStartTime;
		const dx = touch.clientX - touchStartPos.x;
		const dy = touch.clientY - touchStartPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// Detect tap (short duration, minimal movement)
		if (duration < TAP_THRESHOLD && distance < MOVE_THRESHOLD) {
			// Get position relative to container
			if (container.value) {
				const rect = container.value.getBoundingClientRect();
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				emit('tap', x, y);
			}
		}
	}
}

function onClick(e: MouseEvent): void {
	// Only handle click on desktop
	if (!isMobile.value && container.value) {
		const rect = container.value.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		emit('tap', x, y);
	}
}

function onJoystickMove(x: number, z: number, rotation: number): void {
	emit('joystick-move', x, z, rotation);
}

function onJoystickStop(): void {
	emit('joystick-stop');
}

// Resize observer
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
	if (container.value) {
		emit('ready', container.value);

		// Set up resize observer
		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				emit('resize', entry.contentRect.width, entry.contentRect.height);
			}
		});
		resizeObserver.observe(container.value);
	}
});

onUnmounted(() => {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
});

// Expose container for parent access
defineExpose({
	getContainer: () => container.value,
});
</script>

<style lang="scss" module>
.container {
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
	background: linear-gradient(180deg, #87ceeb 0%, #e0f0ff 100%);
	touch-action: none;
	user-select: none;
}

.overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	background: rgba(0, 0, 0, 0.7);
	color: var(--MI_THEME-fg);
	z-index: 50;
}

.errorIcon {
	font-size: 48px;
	color: #f87171;
}

.errorText {
	color: #f87171;
	text-align: center;
	max-width: 80%;
}
</style>
