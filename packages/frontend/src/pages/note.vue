<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div>
			<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
				<div v-if="note">
					<div v-if="showNext" class="_margin">
						<MkNotes class="" :pagination="nextPagination" :noGap="true" :disableAutoLoad="true"/>
					</div>

					<div class="_margin">
						<MkButton v-if="!showNext" :class="$style.loadNext" @click="showNext = true"><i class="ti ti-chevron-up"></i></MkButton>
						<div class="_margin _gaps_s">
							<MkRemoteCaution v-if="note.user.host != null" :href="note.url ?? note.uri"/>
							<MkNoteDetailed :key="note.id" v-model:note="note" :class="$style.note"/>
						</div>
						<div v-if="clips && clips.length > 0" class="_margin">
							<div style="font-weight: bold; padding: 12px;">{{ i18n.ts.clip }}</div>
							<div class="_gaps">
								<MkA v-for="item in clips" :key="item.id" :to="`/clips/${item.id}`">
									<MkClipPreview :clip="item"/>
								</MkA>
							</div>
						</div>
						<MkButton v-if="!showPrev" :class="$style.loadPrev" @click="showPrev = true"><i class="ti ti-chevron-down"></i></MkButton>
					</div>

					<div v-if="showPrev" class="_margin">
						<MkNotes class="" :pagination="prevPagination" :noGap="true"/>
					</div>
				</div>
				<MkError v-else-if="error" @retry="fetchNote()"/>
				<MkLoading v-else/>
			</Transition>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import MkNotes from '@/components/MkNotes.vue';
import MkRemoteCaution from '@/components/MkRemoteCaution.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkClipPreview from '@/components/MkClipPreview.vue';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	noteId: string;
}>();

const note = ref<null | Misskey.entities.Note>();
const clips = ref();
const showPrev = ref(false);
const showNext = ref(false);
const error = ref();

const prevPagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => note.value ? ({
		userId: note.value.userId,
		untilId: note.value.id,
	}) : null),
};

const nextPagination = {
	reversed: true,
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => note.value ? ({
		userId: note.value.userId,
		sinceId: note.value.id,
	}) : null),
};

function fetchNote() {
	showPrev.value = false;
	showNext.value = false;
	note.value = null;
	os.api('notes/show', {
		noteId: props.noteId,
	}).then(res => {
		note.value = res;
		// 古いノートは被クリップ数をカウントしていないので、2023-10-01以前のものは強制的にnotes/clipsを叩く
		if (note.value.clippedCount > 0 || new Date(note.value.createdAt).getTime() < new Date('2023-10-01').getTime()) {
			os.api('notes/clips', {
				noteId: note.value.id,
			}).then((_clips) => {
				clips.value = _clips;
			});
		}
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.noteId, fetchNote, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => note.value ? {
	title: i18n.ts.note,
	subtitle: dateString(note.value.createdAt),
	avatar: note.value.user,
	path: `/notes/${note.value.id}`,
	share: {
		title: i18n.t('noteOf', { user: note.value.user.name }),
		text: note.value.text,
	},
} : null));
</script>

<style lang="scss" module>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.loadNext,
.loadPrev {
	min-width: 0;
	margin: 0 auto;
	border-radius: 999px;
}

.loadNext {
	margin-bottom: var(--margin);
}

.loadPrev {
	margin-top: var(--margin);
}

.note {
	border-radius: var(--radius);
	background: var(--panel);
}
</style>
