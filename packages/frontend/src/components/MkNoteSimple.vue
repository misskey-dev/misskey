<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-show="!isDeleted" :class="$style.root" :tabindex="!isDeleted ? '-1' : undefined">
	<MkAvatar :class="$style.avatar" :user="note.user" link preview/>
	<div :class="$style.main">
		<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
		<div>
			<p v-if="note.cw != null" :class="$style.cw">
				<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'account'" :emojiUrls="note.emojis"/>
				<MkCwButton v-model="showContent" :note="note"/>
			</p>
			<div v-show="note.cw == null || showContent">
				<MkSubNoteContent :class="$style.text" :note="note"/>
			</div>
			<div v-if="note.isSchedule" style="margin-top: 10px;">
				<MkButton :class="$style.button" inline @click="editScheduleNote(note.id)">{{ i18n.ts.edit }}</MkButton>
				<MkButton :class="$style.button" inline danger @click="deleteScheduleNote()">{{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { ref } from 'vue';
import { i18n } from '../i18n.js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
const isDeleted = ref(false);
const props = defineProps<{
  note: Misskey.entities.Note & {isSchedule? : boolean};
}>();

async function deleteScheduleNote() {
	if (!props.note.isSchedule) return;
	// スケジュールつきノートの場合は、ノートIDのフィールドに予約投稿ID(scheduledNoteId)が入るので注意！！！！
	await os.apiWithDialog('notes/schedule/delete', { scheduledNoteId: props.note.id })
		.then(() => {
			isDeleted.value = true;
		});
}

function editScheduleNote(id) {

}

const showContent = $ref(false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 0;
	padding: 0;
	font-size: 0.95em;
  border-bottom: solid 0.5px var(--divider);
}
.button{
  margin-right: var(--margin);
  margin-bottom: var(--margin);
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
