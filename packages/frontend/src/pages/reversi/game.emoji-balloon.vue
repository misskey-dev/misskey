<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="$style.transition_balloon_enterActive"
	:leaveActiveClass="$style.transition_balloon_leaveActive"
	:enterFromClass="$style.transition_balloon_enterFrom"
	:leaveToClass="$style.transition_balloon_leaveTo"
	mode="default"
>
	<MkBalloon
		v-if="active"
		:style="{
			zIndex,
			top: `${y}px`,
			left: `${x}px`,
			transformOrigin: (tail === 'left' ? 'top left' : 'top right'),
		}"
		:class="$style.balloonRoot"
		:tail="tail"
	>
		<MkReactionIcon :reaction="reaction" :class="$style.emoji"/>
	</MkBalloon>
</Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as os from '@/os.js';
import MkBalloon from '@/components/MkBalloon.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';

defineProps<{
	reaction: string;
	tail: 'left' | 'right';
	x: number;
	y: number;
}>();

const emit = defineEmits<{
	(ev: 'end'): void;
}>();

const zIndex = os.claimZIndex('high');

const active = ref(false);

onMounted(() => {
	active.value = true;
	setTimeout(() => {
		active.value = false;
		setTimeout(() => {
			emit('end');
		}, 750);
	}, 3000);
});
</script>

<style module>
.transition_balloon_enterActive {
	transition: all .15s cubic-bezier(0.65, 0.05, 0.36, 1);
}

.transition_balloon_leaveActive {
	transition: all .75s ease;
}

.transition_balloon_enterFrom {
	transform: translateY(-100%) scale(0);
	opacity: 0;
}

.transition_balloon_leaveTo {
	opacity: 0;
}

.balloonRoot {
	position: absolute;
	filter: drop-shadow(0 2px 8px var(--shadow));
	user-select: none;
	pointer-events: none;
}

.emoji {
	height: 32px;
	width: auto;
	max-width: 200px;
}
</style>
