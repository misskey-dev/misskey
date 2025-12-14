<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="joystickContainer"
	:class="$style.container"
	@touchstart.prevent="onTouchStart"
	@touchmove.prevent="onTouchMove"
	@touchend.prevent="onTouchEnd"
	@touchcancel.prevent="onTouchEnd"
>
	<div :class="$style.base">
		<div
			ref="knob"
			:class="$style.knob"
			:style="knobStyle"
		></div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
	(e: 'move', x: number, z: number, rotation: number): void;
	(e: 'stop'): void;
}>();

const props = withDefaults(defineProps<{
	size?: number;
	deadzone?: number;
}>(), {
	size: 120,
	deadzone: 0.1,
});

const joystickContainer = ref<HTMLElement | null>(null);
const knob = ref<HTMLElement | null>(null);

// Joystick state
const isActive = ref(false);
const knobX = ref(0);
const knobY = ref(0);
const touchId = ref<number | null>(null);

// Base position
let baseX = 0;
let baseY = 0;
const maxDistance = computed(() => props.size / 2 - 20);

const knobStyle = computed(() => ({
	transform: `translate(${knobX.value}px, ${knobY.value}px)`,
	transition: isActive.value ? 'none' : 'transform 0.2s ease-out',
}));

function getRelativePosition(clientX: number, clientY: number): { x: number; y: number } {
	if (!joystickContainer.value) return { x: 0, y: 0 };

	const rect = joystickContainer.value.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	return {
		x: clientX - centerX,
		y: clientY - centerY,
	};
}

function clampToCircle(x: number, y: number): { x: number; y: number } {
	const distance = Math.sqrt(x * x + y * y);
	const max = maxDistance.value;

	if (distance > max) {
		const scale = max / distance;
		return {
			x: x * scale,
			y: y * scale,
		};
	}

	return { x, y };
}

function onTouchStart(e: TouchEvent): void {
	if (touchId.value !== null) return;

	const touch = e.touches[0];
	touchId.value = touch.identifier;
	isActive.value = true;

	const pos = getRelativePosition(touch.clientX, touch.clientY);
	const clamped = clampToCircle(pos.x, pos.y);
	knobX.value = clamped.x;
	knobY.value = clamped.y;

	emitMovement();
}

function onTouchMove(e: TouchEvent): void {
	if (touchId.value === null) return;

	// Find our tracked touch
	let touch: Touch | null = null;
	for (let i = 0; i < e.touches.length; i++) {
		if (e.touches[i].identifier === touchId.value) {
			touch = e.touches[i];
			break;
		}
	}

	if (!touch) return;

	const pos = getRelativePosition(touch.clientX, touch.clientY);
	const clamped = clampToCircle(pos.x, pos.y);
	knobX.value = clamped.x;
	knobY.value = clamped.y;

	emitMovement();
}

function onTouchEnd(e: TouchEvent): void {
	// Check if our tracked touch ended
	let found = false;
	for (let i = 0; i < e.touches.length; i++) {
		if (e.touches[i].identifier === touchId.value) {
			found = true;
			break;
		}
	}

	if (!found) {
		isActive.value = false;
		touchId.value = null;
		knobX.value = 0;
		knobY.value = 0;
		emit('stop');
	}
}

function emitMovement(): void {
	const max = maxDistance.value;
	const normalizedX = knobX.value / max;
	const normalizedY = knobY.value / max;

	// Apply deadzone
	const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
	if (magnitude < props.deadzone) {
		emit('stop');
		return;
	}

	// Calculate movement values
	// Y on screen becomes Z in 3D (forward/backward)
	// X on screen stays X in 3D (left/right)
	const moveX = normalizedX;
	const moveZ = normalizedY;

	// Calculate rotation (direction facing)
	const rotation = Math.atan2(moveX, -moveZ);

	emit('move', moveX, moveZ, rotation);
}

// Handle window resize
function updateBasePosition(): void {
	if (!joystickContainer.value) return;
	const rect = joystickContainer.value.getBoundingClientRect();
	baseX = rect.left + rect.width / 2;
	baseY = rect.top + rect.height / 2;
}

onMounted(() => {
	updateBasePosition();
	window.addEventListener('resize', updateBasePosition);
});

onUnmounted(() => {
	window.removeEventListener('resize', updateBasePosition);
});
</script>

<style lang="scss" module>
.container {
	position: fixed;
	bottom: 80px;
	left: 30px;
	width: 120px;
	height: 120px;
	touch-action: none;
	z-index: 100;
	user-select: none;
	-webkit-user-select: none;
}

.base {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.3);
	border: 2px solid rgba(255, 255, 255, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.knob {
	width: 50px;
	height: 50px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	position: absolute;
}
</style>
