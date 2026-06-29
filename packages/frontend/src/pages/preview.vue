<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

👁️ O'zbekcha: Ko'rib chiqish sahifasi
UI komponentlarini namuna sifatida ko'rsatadi
-->

<template>
<div>
	<!-- Ko'rib chiqish komponenti -->
	<MkSample/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSample from '@/components/MkPreview.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

// Sarlavha tugmalari (bo'sh)
const headerActions = computed(() => []);

// Sarlavha varaqalari (bo'sh)
const headerTabs = computed(() => []);

// Sahifa ma'lumotlarini belgilash
definePage(computed(() => ({
	title: i18n.ts.preview,
	icon: 'ti ti-eye',
})));
</script>
