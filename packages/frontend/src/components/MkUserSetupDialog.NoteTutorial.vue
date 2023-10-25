<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="phase === 'aboutNote'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._note.description }}</div>
	<MkNote :class="$style.exampleNoteRoot" style="pointer-events: none;" :note="exampleNote" :mock="true"/>
	<div class="_gaps_s">
		<div><small><MkTime :time="exampleNote.createdAt" colored></MkTime></small> … {{ i18n.ts._initialTutorial._note.date }}</div>
		<div><i class="ti ti-arrow-back-up"></i> <b>{{ i18n.ts.reply }}</b> … {{ i18n.ts._initialTutorial._note.reply }}</div>
		<div><i class="ti ti-repeat"></i> <b>{{ i18n.ts.renote }}</b> … {{ i18n.ts._initialTutorial._note.renote }}</div>
		<div><i class="ti ti-plus"></i> <b>{{ i18n.ts.reaction }}</b> … {{ i18n.ts._initialTutorial._note.reaction }}</div>
	</div>
	<div :class="$style.divider"></div>
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._note.howToNote }}</div>
	<div style="width: 250px; margin: 0 auto;">
		<div :class="[$style.post]">
			<i class="ti ti-pencil ti-fw" :class="$style.postIcon"></i><span :class="$style.postText">{{ i18n.ts.note }}</span>
		</div>
	</div>

</div>
<div v-else-if="phase === 'howToReact'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._reaction.description }}</div>
	<div>{{ i18n.ts._initialTutorial._reaction.letsTryReacting }}</div>
	<MkNote :class="$style.exampleNoteRoot" :note="exampleNote" :mock="true" @reaction="addReaction" @removeReaction="removeReaction"/>
	<div v-if="onceReacted"><b style="color: var(--accent);"><i class="ti ti-check"></i> {{ i18n.ts._initialTutorial.wellDone }}</b> {{ i18n.ts._initialTutorial._reaction.reactDone }}</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { ref, reactive } from 'vue';
import { i18n } from '@/i18n.js';
import MkTime from '@/components/global/MkTime.vue';
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
		name: 'しゅいろ',
		username: 'syuilo',
		host: null,
		avatarDecorations: [],
		avatarUrl: 'https://proxy.misskeyusercontent.com/avatar.webp?url=https%3A%2F%2Fs3.arkjp.net%2Fmisskey%2Fwebpublic-b2dc591e-58b6-4df7-b7c9-1cba199f6619.png&avatar=1',
		avatarBlurhash: 'yFF5Kq0L00?a^*IBNG01^j-pV@D*o|xt58WB}@9at7s.Ip~AWB57%Laes:xaOEoLnis:ofIpoJr?NHtRV@oLoeNHNI%1M{kCWCjuxZ',
		isBot: false,
		isCat: true,
		emojis: {},
		onlineStatus: null,
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

.post {
	position: relative;
	display: block;
	width: 100%;
	height: 40px;
	color: var(--fgOnAccent);
	font-weight: bold;
	text-align: left;

	&:before {
		content: "";
		display: block;
		width: calc(100% - 38px);
		height: 100%;
		margin: auto;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	}

}

.postIcon {
	position: relative;
	margin-left: 30px;
	margin-right: 8px;
	width: 32px;
}

.postText {
	position: relative;
	line-height: 40px;
}
</style>
