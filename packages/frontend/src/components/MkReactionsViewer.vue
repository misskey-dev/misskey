<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="prefer.s.animation ? TransitionGroup : 'div'"
	:enterActiveClass="$style.transition_x_enterActive"
	:leaveActiveClass="$style.transition_x_leaveActive"
	:enterFromClass="$style.transition_x_enterFrom"
	:leaveToClass="$style.transition_x_leaveTo"
	:moveClass="$style.transition_x_move"
	tag="div" :class="$style.root"
>
	<XReaction
		v-for="[reaction, count] in _reactions"
		:key="reaction"
		:reaction="reaction"
		:reactionEmojis="props.reactionEmojis"
		:count="count"
		:isInitial="initialReactions.has(reaction)"
		:noteId="props.noteId"
		:myReaction="props.myReaction"
		@reactionToggled="onMockToggleReaction"
	/>
	<slot v-if="hasMoreReactions" name="more"></slot>
</component>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { inject, watch, ref } from 'vue';
import { TransitionGroup } from 'vue';
import { isSupportedEmoji } from '@@/js/emojilist.js';
import { getEmojiNameFromReaction, isLocalCustomEmojiReaction } from '@@/js/emoji-name.js';
import XReaction from '@/components/MkReactionsViewer.reaction.vue';
import { $i } from '@/i.js';
import { prefer } from '@/preferences.js';
import { customEmojisMap } from '@/custom-emojis.js';
import { DI } from '@/di.js';

const props = withDefaults(defineProps<{
	noteId: Misskey.entities.Note['id'];
	reactions: Misskey.entities.Note['reactions'];
	reactionEmojis: Misskey.entities.Note['reactionEmojis'];
	myReaction: Misskey.entities.Note['myReaction'];
	maxNumber?: number;
}>(), {
	maxNumber: Infinity,
});

const mock = inject(DI.mock, false);

const emit = defineEmits<{
	(ev: 'mockUpdateMyReaction', emoji: string, delta: number): void;
}>();

const initialReactions = new Set(Object.keys(props.reactions));

const _reactions = ref<[string, number][]>([]);
const hasMoreReactions = ref(false);

if (props.myReaction != null && !(props.myReaction in props.reactions)) {
	_reactions.value.push([props.myReaction, props.reactions[props.myReaction]]);
}

function onMockToggleReaction(emoji: string, count: number) {
	if (!mock) return;

	const i = _reactions.value.findIndex((item) => item[0] === emoji);
	if (i < 0) return;

	emit('mockUpdateMyReaction', emoji, (count - _reactions.value[i][1]));
}

function canReact(reaction: string) {
	if (!$i) return false;
	// TODO: CheckPermissions
	return isLocalCustomEmojiReaction(reaction)
		? customEmojisMap.has(getEmojiNameFromReaction(reaction))
		: isSupportedEmoji(reaction);
}

watch([() => props.reactions, () => props.maxNumber], ([newSource, maxNumber]) => {
	let newReactions: [string, number][] = [];
	hasMoreReactions.value = Object.keys(newSource).length > maxNumber;

	for (let i = 0; i < _reactions.value.length; i++) {
		const reaction = _reactions.value[i][0];
		if (reaction in newSource && newSource[reaction] !== 0) {
			_reactions.value[i][1] = newSource[reaction];
			newReactions.push(_reactions.value[i]);
		}
	}

	const sorted = Object.entries(newSource);
	if (prefer.s.showAvailableReactionsFirstInNote) {
		// ソートの比較関数内で評価すると同じ絵文字に対して何度も実行されるため、事前に1回だけ評価しておく
		const canReactCache = new Map<string, boolean>();
		for (const [emoji] of sorted) {
			canReactCache.set(emoji, canReact(emoji));
		}
		sorted.sort(([emojiA, countA], [emojiB, countB]) => {
			const canReactA = canReactCache.get(emojiA)!;
			const canReactB = canReactCache.get(emojiB)!;
			if (canReactA !== canReactB) return canReactA ? -1 : 1;
			return countB - countA;
		});
	} else {
		sorted.sort(([, countA], [, countB]) => countB - countA);
	}

	const newReactionsNames = new Set(newReactions.map(([x]) => x));
	newReactions = [
		...newReactions,
		...sorted.filter(([y], i) => i < maxNumber && !newReactionsNames.has(y)),
	];

	newReactions = newReactions.slice(0, props.maxNumber);

	if (props.myReaction && !newReactions.some(([x]) => x === props.myReaction)) {
		newReactions.push([props.myReaction, newSource[props.myReaction]]);
	}

	_reactions.value = newReactions;
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
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;

	&:empty {
		display: none;
	}
}
</style>
