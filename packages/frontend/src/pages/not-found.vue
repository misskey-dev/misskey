<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

📝 O'zbekcha izoh:
Bu sahifa - Topilmagan (404) xatosi sahifasi
Foydalanuvchi noto'g'ri URL-ga kirganda ko'rsatiladi
-->

<template>
<div style="align-content: center; height: 100cqh;">
	<!-- Topilmagan sahifa xabari -->
	<MkResult type="notFound" :text="i18n.ts.notFoundDescription"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { pleaseLogin } from '@/utility/please-login.js';

// Prop-lar: Login popup ko'rsatish (ixtiyoriy)
const props = defineProps<{
	showLoginPopup?: boolean;
}>();

// Agar login popup talab qilinsa
if (props.showLoginPopup) {
	pleaseLogin({ path: '/' });
}

// Sarlavha tugmasi (bo'sh)
const headerActions = computed(() => []);

// Sarlavha varaqalari (bo'sh)
const headerTabs = computed(() => []);

// Sahifa ma'lumotlarini belgilash
definePage(() => ({
	title: i18n.ts.notFound,
	icon: 'ti ti-alert-triangle',
}));
</script>

<style lang="scss" module>
/* Stil - centrlashtirilgan ko'rinish */
</style>
