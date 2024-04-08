<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkModal ref="modal" :preferType="'dialog'" @close="modal?.close()" @closed="emit('closed')">
		<div :class="$style.root">
			<i class="ti ti-info-circle" :class="$style.icon" />
			<div :class="$style.body" v-if="attachedNotes === null">
				<MkLoading />
			</div>
			<div v-else>
				<div v-if="0 < attachedNotes.length" :class="$style.body">
					<span>{{ i18n.tsx.theFollowingNotesAreAffected({ name: file.name }) }}</span>
					<div>
						<MkNoteSimple v-for="note in attachedNotes.slice(0, 3)" :note="note" :class="$style.note" />
						<MkFolder v-if="3 < attachedNotes.length">
							<template #label>...{{ i18n.tsx.otherNNotes({ n: attachedNotes.length - 3 }) }}</template>
							<MkNoteSimple v-for="note in attachedNotes.slice(3)" :note="note" :class="[$style.note, $style.collapsedNote]" />
						</MkFolder>
					</div>
					<span>{{ i18n.ts.pagesAndGalleriesAreAlsoAffected }}</span>
				</div>
				<div v-else :class="$style.body">
					<span>{{ i18n.tsx.driveFileDeleteConfirm({ name: file.name }) }}</span>
				</div>
			</div>
			<div :class="$style.buttons">
				<MkButton primary rounded @click="deleteFile">{{ i18n.ts.delete }}</MkButton>
				<MkButton rounded @click="modal?.close()">{{ i18n.ts.cancel }}</MkButton>
			</div>
		</div>
	</MkModal>
</template>

<script setup lang="ts">
import MkModal from "@/components/MkModal.vue";
import { ref } from "vue";
import * as Misskey from 'misskey-js';
import { misskeyApi } from "@/scripts/misskey-api.js";
import MkNoteSimple from "@/components/MkNoteSimple.vue";
import { i18n } from "../i18n.js";
import MkFolder from "@/components/MkFolder.vue";
import MkButton from "@/components/MkButton.vue";
const modal = ref<InstanceType<typeof MkModal>>();
const props = defineProps<{
	file: Misskey.entities.DriveFile,
}>();
const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'done'): void;
}>();
const attachedNotes = ref<Misskey.entities.Note[] | null>(null);

misskeyApi("drive/files/attached-notes", { fileId: props.file.id }).then((res: Misskey.entities.Note[]) => {
	attachedNotes.value = res;
});
const deleteFile = async () => {
	await misskeyApi("drive/files/delete", { fileId: props.file.id });
	emit("done");
	modal.value?.close();
};
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
	width: 600px;
}

.icon {
	font-size: 24px;
}

.body {
	display: flex;
	flex-direction: column;
	gap: 0.5em;
	margin-top: 1em;
}

.note {
	background: var(--bg);
	padding: var(--margin);
	border-radius: var(--radius);
	margin-bottom: 5px;

	&.collapsedNote {
		background: var(--panel);

		&:last-child {
			margin-bottom: 0;
		}
	}
}

.buttons {
	display: flex;
	justify-content: center;
	gap: 1em;
	margin-top: 1em;
}
</style>
