<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer>
	<template #icon><i class="ti ti-photo"></i></template>
	<template #header>{{ i18n.ts.files }}</template>
	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<MkError v-else-if="error" @retry="fetchNotes()"/>
		<div v-else-if="notes.length > 0" class="_gaps_s">
			<div :class="$style.stream">
				<MkNoteMediaGrid v-for="note in notes" :note="note"/>
			</div>
			<MkButton rounded full @click="emit('showMore')">{{ i18n.ts.showMore }} <i class="ti ti-arrow-right"></i></MkButton>
		</div>
		<p v-else>{{ i18n.ts.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';
import MkNoteMediaGrid from '@/components/MkNoteMediaGrid.vue';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const emit = defineEmits<{
	(ev: 'showMore'): void;
}>();

const fetching = ref(true);
const error = ref(false);
const notes = ref<Misskey.entities.Note[]>([]);

function fetchNotes() {
	fetching.value = true;
	error.value = false;
	misskeyApi('users/notes', {
		userId: props.user.id,
		withFiles: true,
		limit: 10,
	}).then(_notes => {
		notes.value = _notes;
	}).catch(() => {
		// 取得の失敗を「何もない」と区別して表示する
		error.value = true;
	}).finally(() => {
		fetching.value = false;
	});
}

onMounted(() => {
	fetchNotes();
});
</script>

<style lang="scss" module>
.root {
	padding: 8px;
}

.stream {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 6px;

	>:nth-child(n+9) {
		display: none;
	}
}
</style>
