<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_fullinfo">
		<img v-if="serverMetadata.notFoundImageUrl" :src="serverMetadata.notFoundImageUrl" class="_ghost"/>
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { pleaseLogin } from '@/scripts/please-login.js';

import { DI } from '@/di.js';

const serverMetadata = inject(DI.serverMetadata);

const props = defineProps<{
	showLoginPopup?: boolean;
}>();

if (props.showLoginPopup) {
	pleaseLogin('/');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.notFound,
	icon: 'ti ti-alert-triangle',
}));
</script>
