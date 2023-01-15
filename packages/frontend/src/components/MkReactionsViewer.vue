<template>
<TransitionGroup
	:enter-active-class="$store.state.animation ? $style.transition_x_enterActive : ''"
	:leave-active-class="$store.state.animation ? $style.transition_x_leaveActive : ''"
	:enter-from-class="$store.state.animation ? $style.transition_x_enterFrom : ''"
	:leave-to-class="$store.state.animation ? $style.transition_x_leaveTo : ''"
	:move-class="$store.state.animation ? $style.transition_x_move : ''"
	tag="div" :class="$style.root"
>
	<XReaction v-for="(count, reaction) in note.reactions" :key="reaction" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note"/>
</TransitionGroup>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import { $i } from '@/account';
import XReaction from '@/components/MkReactionsViewer.reaction.vue';

const props = defineProps<{
	note: misskey.entities.Note;
}>();

const initialReactions = new Set(Object.keys(props.note.reactions));

const isMe = computed(() => $i && $i.id === props.note.userId);
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_x_leaveActive {
	position: absolute;
}

.root {
	margin: 4px -2px 0 -2px;

	&:empty {
		display: none;
	}
}
</style>
