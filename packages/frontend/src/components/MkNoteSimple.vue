<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!muted" :class="$style.root">
	<MkAvatar :class="$style.avatar" :user="note.user" link preview/>
	<div :class="$style.main">
		<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
		<div>
			<p v-if="note.cw != null" :class="$style.cw">
				<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
				<MkCwButton v-model="showContent" :note="note"/>
			</p>
			<div v-show="note.cw == null || showContent">
				<MkSubNoteContent :class="$style.text" :note="note"/>
			</div>
		</div>
	</div>
</div>
<div v-else :class="$style.muted" @click="muted = false">
	<I18n :src="i18n.ts.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="note.userId" :to="userPage(note.user)">
				<MkUserName :user="note.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import { $i } from '@/account.js';
import { checkWordMute } from '@/scripts/check-word-mute.js';
import { deepClone } from '@/scripts/clone.js';
import { userPage } from '@/filters/user.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

let note = $ref(deepClone(props.note));
const muted = ref(checkWordMute(note, $i, $i?.mutedWords));

const showContent = $ref(false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 0;
	padding: 0;
	font-size: 0.95em;
}

.avatar {
	flex-shrink: 0;
	display: block;
	margin: 0 10px 0 0;
	width: 34px;
	height: 34px;
	border-radius: 8px;
	position: sticky !important;
	top: calc(16px + var(--stickyTop, 0px));
	left: 0;
}

.main {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 2px;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.text {
	cursor: default;
	margin: 0;
	padding: 0;
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}

@container (min-width: 250px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 40px;
		height: 40px;
	}
}

@container (min-width: 350px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 44px;
		height: 44px;
	}
}

@container (min-width: 500px) {
	.avatar {
		margin: 0 12px 0 0;
		width: 48px;
		height: 48px;
	}
}
</style>
