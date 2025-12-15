<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<!-- T024, T029: Virtual joystick component positioned at bottom-left/right -->
	<div
		ref="joystickContainer"
		:class="[$style.joystickContainer, position === 'right' ? $style.joystickRight : $style.joystickLeft]"
	></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
// T025: Import nipplejs for virtual joystick
import nipplejs from 'nipplejs';
import type { JoystickManager, JoystickOutputData } from 'nipplejs';

const props = defineProps<{
	position?: 'left' | 'right';
}>();

const emit = defineEmits<{
	(e: 'move', direction: { x: number; z: number }): void;
	(e: 'end'): void;
}>();

const joystickContainer = ref<HTMLDivElement | null>(null);
let manager: JoystickManager | null = null;

// Create joystick manager with position based on prop
function createJoystick(): void {
	if (!joystickContainer.value) return;

	// Destroy existing manager if any
	if (manager) {
		manager.destroy();
		manager = null;
	}

	// Calculate position based on prop
	const positionConfig = props.position === 'right'
		? { right: '80px', bottom: '80px' }
		: { left: '80px', bottom: '80px' };

	// T025: Create nipplejs joystick instance
	manager = nipplejs.create({
		zone: joystickContainer.value,
		mode: 'static',
		position: positionConfig,
		color: 'rgba(255, 255, 255, 0.5)',
		size: 120,
	});

	// T026: Convert joystick direction to movement vector
	manager.on('move', (evt: any, data: JoystickOutputData) => {
		if (data.vector) {
			// Convert joystick vector to movement direction
			// nipplejs returns vector with x (horizontal) and y (vertical)
			// We map y to z for 3D movement
			const x = data.vector.x; // Left/Right
			const z = -data.vector.y; // Forward/Backward (inverted because nipplejs y is up)

			emit('move', { x, z });
		}
	});

	manager.on('end', () => {
		emit('end');
	});
}

// Watch for position changes and recreate joystick
watch(() => props.position, () => {
	createJoystick();
});

onMounted(() => {
	createJoystick();
});

onUnmounted(() => {
	if (manager) {
		manager.destroy();
		manager = null;
	}
});
</script>

<style module>
/* FR-024: Position joystick higher to avoid overlap with chat input on mobile */
/* touch-action: manipulation でiOSダブルタップズームを無効化 */
/* PWA safe-area-inset-bottom を考慮してジョイスティックの位置を調整 */
/* user-select: none でテキスト選択を無効化 */
.joystickContainer {
	position: fixed;
	bottom: calc(69px + env(safe-area-inset-bottom, 0px));
	width: 160px;
	height: 160px;
	z-index: 1000;
	pointer-events: auto;
	touch-action: manipulation;
	user-select: none;
	-webkit-user-select: none;
}

/* Default position: left */
.joystickLeft {
	left: 20px;
	right: auto;
}

/* Swapped position: right */
.joystickRight {
	right: 20px;
	left: auto;
}
</style>
