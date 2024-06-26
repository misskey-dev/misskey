<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkSample/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSample from '@/components/MkPreview.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.preview,
	icon: 'ti ti-eye',
})));
</script>
