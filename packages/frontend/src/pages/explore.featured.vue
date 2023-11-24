<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<MkTab v-model="tab" style="margin-bottom: var(--margin);">
		<option value="notes">{{ i18n.ts.notes }}</option>
		<option value="polls">{{ i18n.ts.poll }}</option>
	</MkTab>
	<MkNotes v-if="tab === 'notes'" :pagination="paginationForNotes"/>
	<MkNotes v-else-if="tab === 'polls'" :pagination="paginationForPolls"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import MkNotes from '@/components/MkNotes.vue';
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
};

let tab = $ref('notes');
</script>
