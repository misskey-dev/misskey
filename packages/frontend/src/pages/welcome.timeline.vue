<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps">
	<div
		ref="notesMainContainerEl"
		class="_gaps"
		:class="[$style.scrollBoxMain, { [$style.scrollIntro]: (scrollState === 'intro'), [$style.scrollLoop]: (scrollState === 'loop') }]"
		@animationend="changeScrollState"
	>
		<XNote v-for="note in notes" :key="`${note.id}_1`" :class="$style.note" :note="note"/>
	</div>
	<div v-if="isScrolling" class="_gaps" :class="[$style.scrollBoxSub, { [$style.scrollIntro]: (scrollState === 'intro'), [$style.scrollLoop]: (scrollState === 'loop') }]">
		<XNote v-for="note in notes" :key="`${note.id}_2`" :class="$style.note" :note="note"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { onUpdated, ref, shallowRef } from 'vue';
import XNote from '@/pages/welcome.timeline.note.vue';
import { misskeyApiGet } from '@/scripts/misskey-api.js';
import { getScrollContainer } from '@@/js/scroll.js';

const notes = ref<Misskey.entities.Note[]>([]);
const isScrolling = ref(false);
const scrollState = ref<null | 'intro' | 'loop'>(null);
const notesMainContainerEl = shallowRef<HTMLElement>();

misskeyApiGet('notes/featured').then(_notes => {
	notes.value = _notes;
});

function changeScrollState() {
	if (scrollState.value !== 'loop') {
		scrollState.value = 'loop';
	}
}

onUpdated(() => {
	if (!notesMainContainerEl.value) return;
	const container = getScrollContainer(notesMainContainerEl.value);
	const containerHeight = container ? container.clientHeight : window.innerHeight;
	if (notesMainContainerEl.value.offsetHeight > containerHeight) {
		if (scrollState.value === null) {
			scrollState.value = 'intro';
		}
		isScrolling.value = true;
	}
});
</script>

<style lang="scss" module>
@keyframes scrollIntro {
	0% {
		transform: translate3d(0, 0, 0);
	}
	100% {
		transform: translate3d(0, calc(calc(-100% - 128px) - var(--margin)), 0);
	}
}

@keyframes scrollConstant {
	0% {
		transform: translate3d(0, -128px, 0);
	}
	100% {
		transform: translate3d(0, calc(calc(-100% - 128px) - var(--margin)), 0);
	}
}

.root {
	text-align: right;
}

.scrollBoxMain {
	&.scrollIntro {
		animation: scrollIntro 30s linear forwards;
	}
	&.scrollLoop {
		animation: scrollConstant 30s linear infinite;
	}
}

.scrollBoxSub {
	&.scrollIntro {
		animation: scrollIntro 30s linear forwards;
	}
	&.scrollLoop {
		animation: scrollConstant 30s linear infinite;
	}
}

.root:has(.note:hover) .scrollBoxMain,
.root:has(.note:hover) .scrollBoxSub {
	animation-play-state: paused;
}
</style>
