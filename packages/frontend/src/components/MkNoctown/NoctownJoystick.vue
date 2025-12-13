<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<!-- T024, T029: Virtual joystick component positioned at bottom-left -->
	<div ref="joystickContainer" :class="$style.joystickContainer"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
// T025: Import nipplejs for virtual joystick
import nipplejs from 'nipplejs';
import type { JoystickManager, JoystickOutputData } from 'nipplejs';

const emit = defineEmits<{
	(e: 'move', direction: { x: number; z: number }): void;
	(e: 'end'): void;
}>();

const joystickContainer = ref<HTMLDivElement | null>(null);
let manager: JoystickManager | null = null;

onMounted(() => {
	if (!joystickContainer.value) return;

	// T025: Create nipplejs joystick instance
	manager = nipplejs.create({
		zone: joystickContainer.value,
		mode: 'static',
		position: { left: '80px', bottom: '80px' },
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
});

onUnmounted(() => {
	if (manager) {
		manager.destroy();
		manager = null;
	}
});
</script>

<style module>
/* T029: Position joystick at bottom-left corner */
.joystickContainer {
	position: fixed;
	bottom: 20px;
	left: 20px;
	width: 160px;
	height: 160px;
	z-index: 1000;
	pointer-events: auto;
}
</style>
