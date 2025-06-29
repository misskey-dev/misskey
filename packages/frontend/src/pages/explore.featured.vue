<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkTab v-model="tab" style="margin-bottom: var(--MI-margin);">
		<option value="notes">{{ i18n.ts.notes }}</option>
		<option value="polls">{{ i18n.ts.poll }}</option>
	</MkTab>
	<MkNotesTimeline v-if="tab === 'notes'" :pagination="paginationForNotes"/>
	<MkNotesTimeline v-else-if="tab === 'polls'" :pagination="paginationForPolls"/>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';

const paginationForNotes = {
	endpoint: 'notes/featured' as const,
	limit: 10,
};

const paginationForPolls = {
	endpoint: 'notes/polls/recommendation' as const,
	limit: 10,
	offsetMode: true,
	params: {
		excludeChannels: true,
	},
};

const tab = ref('notes');
</script>
