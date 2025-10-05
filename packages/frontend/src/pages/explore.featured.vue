<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkTab
		v-model="tab"
		:tabs="[
			{ key: 'notes', label: i18n.ts.notes },
			{ key: 'polls', label: i18n.ts.poll },
		]"
		style="margin-bottom: var(--MI-margin);"
	>
	</MkTab>
	<MkNotesTimeline v-if="tab === 'notes'" :paginator="paginatorForNotes"/>
	<MkNotesTimeline v-else-if="tab === 'polls'" :paginator="paginatorForPolls"/>
</div>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const paginatorForNotes = markRaw(new Paginator('notes/featured', {
	limit: 10,
}));

const paginatorForPolls = markRaw(new Paginator('notes/polls/recommendation', {
	limit: 10,
	offsetMode: true,
	params: {
		excludeChannels: true,
	},
}));

const tab = ref<'notes' | 'polls'>('notes');
</script>
