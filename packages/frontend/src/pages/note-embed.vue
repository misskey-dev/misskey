<template>
<div class="fcuexfpr">
	<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
		<div v-if="note" class="note">
			<div class="main">
				<div class="note _gaps_s">
					<MkRemoteCaution v-if="note.user.host != null" :href="notePage(note)"/>
					<MkNoteDetailed :key="note.id" v-model:note="note" :embed="true" class="note"/>
				</div>
			</div>
		</div>
		<MkError v-else-if="error" @retry="fetchNote()"/>
		<MkLoading v-else/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import MkRemoteCaution from '@/components/MkRemoteCaution.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { dateString } from '@/filters/date';
import MkClipPreview from '@/components/MkClipPreview.vue';
import { defaultStore } from '@/store';
import { notePage } from '@/filters/note';

const props = defineProps<{
	noteId: string;
}>();

let note = $ref<null | misskey.entities.Note>();
let error = $ref();

function fetchNote() {
	note = null;
	os.api('notes/show', {
		noteId: props.noteId,
	}).then(res => {
		note = res;
		Promise.all([
			os.api('users/notes', {
				userId: note.userId,
				untilId: note.id,
				limit: 1,
			}),
			os.api('users/notes', {
				userId: note.userId,
				sinceId: note.id,
				limit: 1,
			}),
		]);
	}).catch(err => {
		error = err;
	});
}

function goNotePage() {
	window.open(notePage(note), "_blank");
}

watch(() => props.noteId, fetchNote, {
	immediate: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => note ? {
	title: i18n.ts.note,
	subtitle: dateString(note.createdAt),
	avatar: note.user,
	path: `/notes/${note.id}/embed`,
	share: {
		title: i18n.t('noteOf', { user: note.user.name }),
		text: note.text,
	},
} : null));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fcuexfpr {
	background: var(--bg);

	> .note {
		height: 100%;
		position: relative;

		> a {
			z-index: 0;
			position: relative;

			&:hover {
				text-decoration: none;
			}

			> .main {
				z-index: 1;
				position: relative;

				> .load {
					min-width: 0;
					margin: 0 auto;
					border-radius: 999px;

					&.next {
						margin-bottom: var(--margin);
					}

					&.prev {
						margin-top: var(--margin);
					}
				}

				> .note {
					> .note {
						border-radius: var(--radius);
						background: var(--panel);
					}
				}

				> .clips {
					> .title {
						font-weight: bold;
						padding: 12px;
					}
				}
			}
		}
	}
}
</style>
