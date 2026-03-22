<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection>
		<template #label>{{ i18n.ts._noq.questionBox }}</template>
		<NoqSettings />
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts._noq.mutedUsers }}</template>
		<NoqMutedUsers />
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import FormSection from '@/components/form/section.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

const NoqSettings = defineAsyncComponent(() => import('@/components/noq/NoqSettings.vue'));
const NoqMutedUsers = defineAsyncComponent(() => import('@/components/noq/NoqMutedUsers.vue'));

definePage(() => ({
	title: i18n.ts._noq.settings,
	icon: 'ti ti-message-question',
}));
</script>
