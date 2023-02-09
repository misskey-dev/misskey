<template>
<TransitionGroup
	:enter-active-class="$store.state.animation ? $style.transition_x_enterActive : ''"
	:leave-active-class="$store.state.animation ? $style.transition_x_leaveActive : ''"
	:enter-from-class="$store.state.animation ? $style.transition_x_enterFrom : ''"
	:leave-to-class="$store.state.animation ? $style.transition_x_leaveTo : ''"
	:move-class="$store.state.animation ? $style.transition_x_move : ''"
	tag="div" :class="$style.root"
>
	<template v-for="([reaction, count], i) in reactions">
		<XReaction v-if="!maxNumber || i < maxNumber" :key="reaction" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note"/>
	</template>
	<slot name="extras" />
</TransitionGroup>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import XReaction from '@/components/MkReactionsViewer.reaction.vue';

const props = defineProps<{
	note: misskey.entities.Note;
	maxNumber?: number;
}>();

const initialReactions = new Set(Object.keys(props.note.reactions));

const reactions = $computed(() => {
	return Object.entries(props.note.reactions).sort(([, countA], [, countB]) => countB - countA);
});
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
