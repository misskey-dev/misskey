<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="phase === 'aboutNote'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._note.description }}</div>
	<MkNote :class="$style.exampleNoteRoot" style="pointer-events: none;" :note="exampleNote" :mock="true"/>
	<div class="_gaps_s">
		<div><i class="ti ti-arrow-back-up"></i> <b>{{ i18n.ts.reply }}</b> … {{ i18n.ts._initialTutorial._note.reply }}</div>
		<div><i class="ti ti-repeat"></i> <b>{{ i18n.ts.renote }}</b> … {{ i18n.ts._initialTutorial._note.renote }}</div>
		<div><i class="ti ti-plus"></i> <b>{{ i18n.ts.reaction }}</b> … {{ i18n.ts._initialTutorial._note.reaction }}</div>
		<div><i class="ti ti-dots"></i> <b>{{ i18n.ts.menu }}</b> … {{ i18n.ts._initialTutorial._note.menu }}</div>
	</div>
</div>
<div v-else-if="phase === 'howToReact'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._reaction.description }}</div>
	<div>{{ i18n.ts._initialTutorial._reaction.letsTryReacting }}</div>
	<MkNote :class="$style.exampleNoteRoot" :note="exampleNote" :mock="true" @reaction="addReaction" @removeReaction="removeReaction"/>
	<div v-if="onceReacted"><b style="color: var(--accent);"><i class="ti ti-check"></i> {{ i18n.ts._initialTutorial.wellDone }}</b> {{ i18n.ts._initialTutorial._reaction.reactNotification }}<br>{{ i18n.ts._initialTutorial._reaction.reactDone }}</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { ref, reactive } from 'vue';
import { i18n } from '@/i18n.js';
import { globalEvents } from '@/events.js';
import { $i } from '@/account.js';
import MkNote from '@/components/MkNote.vue';

const props = defineProps<{
	phase: 'aboutNote' | 'howToReact';
}>();

const emit = defineEmits<{
	(ev: 'reacted'): void;
}>();

const exampleNote = reactive<Misskey.entities.Note>({
	id: '0000000000',
	createdAt: '2019-04-14T17:30:49.181Z',
	userId: '0000000001',
	user: {
		id: '0000000001',
		name: '藍',
		username: 'ai',
		host: null,
		avatarDecorations: [],
		avatarUrl: '/client-assets/tutorial/ai.webp',
		avatarBlurhash: 'eiKmhHIByXxZ~qWXs:-pR*NbR*s:xuRjoL-oR*WCt6WWf6WVf6oeWB',
		isBot: false,
		isCat: true,
		emojis: {},
		onlineStatus: 'unknown',
		badgeRoles: [],
	},
	text: 'just setting up my msky',
	cw: null,
	visibility: 'public',
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 1,
	reactions: {},
	reactionEmojis: {},
	fileIds: [],
	files: [],
	replyId: null,
	renoteId: null,
});
const onceReacted = ref<boolean>(false);

function addReaction(emoji) {
	onceReacted.value = true;
	emit('reacted');
	exampleNote.reactions[emoji] = 1;
	exampleNote.myReaction = emoji;
	doNotification(emoji);
}

function doNotification(emoji: string): void {
	if (!$i || !emoji) return;

	const notification: Misskey.entities.Notification = {
		id: Math.random().toString(),
		createdAt: new Date().toUTCString(),
		type: 'reaction',
		reaction: emoji,
		user: $i,
		userId: $i.id,
		note: exampleNote,
	};

	globalEvents.emit('clientNotification', notification);
}

function removeReaction(emoji) {
	delete exampleNote.reactions[emoji];
	exampleNote.myReaction = undefined;
}
</script>

<style lang="scss" module>
.exampleNoteRoot {
	border-radius: var(--radius);
	border: var(--panelBorder);
	background: var(--panel);
}

.divider {
	height: 1px;
	background: var(--divider);
}
</style>
