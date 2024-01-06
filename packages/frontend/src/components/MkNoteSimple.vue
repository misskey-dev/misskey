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
				<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
				<MkCwButton v-model="showContent" :text="note.text" :files="note.files" :poll="note.poll"/>
			</p>
			<div v-show="note.cw == null || showContent">
				<MkSubNoteContent :class="$style.text" :note="note"/>
			</div>
			<div v-if="note.isSchedule" style="margin-top: 10px;">
				<MkButton :class="$style.button" inline @click="editScheduleNote()"><i class="ti ti-pencil"></i> {{ i18n.ts.deleteAndEdit }}</MkButton>
				<MkButton :class="$style.button" inline danger @click="deleteScheduleNote()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '../i18n.js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import {misskeyApi} from "@/scripts/misskey-api.js";
const isDeleted = ref(false);
const props = defineProps<{
	note: Misskey.entities.Note & {
		id: string | null;
		isSchedule?: boolean;
		scheduledNoteId?: string;
	};
}>();

const emit = defineEmits<{
  (ev: 'editScheduleNote'): void;
}>();

async function deleteScheduleNote() {
	if (!props.note.isSchedule || !props.note.scheduledNoteId) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._schedulePost.deleteAreYouSure,
	});
	if (canceled) return;

	await os.apiWithDialog('notes/schedule/delete', { scheduledNoteId: props.note.scheduledNoteId })
		.then(() => {
			isDeleted.value = true;
		});
}

async function editScheduleNote() {
	if (!props.note.isSchedule || !props.note.scheduledNoteId) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._schedulePost.deleteAndEditConfirm,
	});

	if (canceled) return;

	await misskeyApi('notes/schedule/delete', { scheduledNoteId: props.note.scheduledNoteId })
		.then(() => {
			isDeleted.value = true;
		});

	await os.post({ initialNote: props.note, renote: props.note.renote, reply: props.note.reply, channel: props.note.channel });

	emit('editScheduleNote');
}

const showContent = ref(false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 0;
	padding: 0;
	font-size: 0.95em;

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
