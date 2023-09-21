<template>
<TransitionGroup
	:enter-active-class="defaultStore.state.animation ? $style.transition_x_enterActive : ''"
	:leave-active-class="defaultStore.state.animation ? $style.transition_x_leaveActive : ''"
	:enter-from-class="defaultStore.state.animation ? $style.transition_x_enterFrom : ''"
	:leave-to-class="defaultStore.state.animation ? $style.transition_x_leaveTo : ''"
	:move-class="defaultStore.state.animation ? $style.transition_x_move : ''"
	tag="div" :class="$style.root"
>
	<XReaction v-for="[reaction, count] in reactions" :key="reaction" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note"/>
	<slot v-if="hasMoreReactions" name="more"/>
</TransitionGroup>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { watch } from 'vue';
import XReaction from '@/components/MkReactionsViewer.reaction.vue';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	note: misskey.entities.Note;
	maxNumber?: number;
}>(), {
	maxNumber: Infinity,
});

const initialReactions = new Set(Object.keys(props.note.reactions));

let reactions = $ref<[string, number][]>([]);
let hasMoreReactions = $ref(false);

if (props.note.myReaction && !Object.keys(reactions).includes(props.note.myReaction)) {
	reactions[props.note.myReaction] = props.note.reactions[props.note.myReaction];
}

watch([() => props.note.reactions, () => props.maxNumber], ([newSource, maxNumber]) => {
	let newReactions: [string, number][] = [];
	hasMoreReactions = Object.keys(newSource).length > maxNumber;

	for (let i = 0; i < reactions.length; i++) {
		const reaction = reactions[i][0];
		if (reaction in newSource && newSource[reaction] !== 0) {
			reactions[i][1] = newSource[reaction];
			newReactions.push(reactions[i]);
		}
	}

	const newReactionsNames = newReactions.map(([x]) => x);
	newReactions = [
		...newReactions,
		...Object.entries(newSource)
			.sort(([, a], [, b]) => b - a)
			.filter(([y], i) => i < maxNumber && !newReactionsNames.includes(y)),
	];

	newReactions = newReactions.slice(0, props.maxNumber);

	if (props.note.myReaction && !newReactions.map(([x]) => x).includes(props.note.myReaction)) {
		newReactions.push([props.note.myReaction, newSource[props.note.myReaction]]);
	}

	reactions = newReactions;
}, { immediate: true, deep: true });
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
