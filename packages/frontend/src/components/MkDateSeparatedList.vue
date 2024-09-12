<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
 :is="defaultStore.state.animation ? TransitionGroup : 'div'"
 :class="[
	$style.dateSeparatedList,
	{ [$style.dateSeparatedListNoGap]: props.noGap },
	{ [$style.reversed]: props.reversed },
	{ [$style.directionDown]: props.direction === 'down' },
	{ [$style.directionUp]: props.direction === 'up' },
 ]"
 v-bind="defaultStore.state.animation ? {
	name: 'list',
	tag: 'div',
	onBeforeLeave,
	onLeaveCancelled,
 } : {}"
>
	<XItem v-for="item, index in items" :key="`${item.id}:wrapper`" :item="item" :nextItem="items[index + 1] ?? null" :ad="ad">
		<slot :item="item"></slot>
	</XItem>
</component>
</template>

<script setup lang="ts" generic="E extends MisskeyEntity">
import { TransitionGroup } from 'vue';
import { defaultStore } from '@/store.js';
import type { MisskeyEntity } from '@/types/date-separated-list.js';
import XItem from '@/components/MkDateSeparatedList.item.vue';

const props = defineProps<{
	items: E[];
	direction?: 'up' | 'down';
	reversed?: boolean;
	noGap?: boolean;
	ad?: boolean;
}>();

function onBeforeLeave(element: HTMLElement) {
	element.style.top = `${element.offsetTop}px`;
	element.style.left = `${element.offsetLeft}px`;
}

function onLeaveCancelled(element: HTMLElement) {
	element.style.top = '';
	element.style.left = '';
}

</script>

<style lang="scss" module>
.dateSeparatedList {
	container-type: inline-size;

	&:global {
		> .list-move {
			transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
		}

		&.deny-move-transition > .list-move {
			transition: none !important;
		}

		> .list-enter-active {
			transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);
		}

		> *:empty {
			display: none;
		}
	}

	&:not(.dateSeparatedListNoGap) > *:not(:last-child) {
		margin-bottom: var(--margin);
	}
}

.dateSeparatedListNoGap {
	> * {
		margin: 0 !important;
		border: none;
		border-radius: 0;
		box-shadow: none;

		&:not(:last-child) {
			border-bottom: solid 0.5px var(--divider);
		}
	}
}

.directionUp {
	&:global {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(64px);
		}
	}
}
.directionDown {
	&:global {
		> .list-enter-from,
		> .list-leave-to {
			opacity: 0;
			transform: translateY(-64px);
		}
	}
}

.reversed {
	display: flex;
	flex-direction: column-reverse;
}
</style>
