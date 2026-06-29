<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

📢 O'zbekcha: Reklama sahifasi
Sistema reklamalarini ko'rsatadi
-->

<template>
<PageWithHeader>
	<!-- Container: Reklamalar ro'yxati -->
	<div class="_spacer" style="--MI_SPACER-w: 500px;">
		<!-- Agar reklamalar bor bo'lsa -->
		<div v-if="instance.ads.length > 0" class="_gaps">
			<!-- Har bir reklamani ko'rsatish -->
			<MkAd v-for="ad in instance.ads" :key="ad.id" :specify="ad"/>
		</div>
		<!-- Bo'sh holati (reklamalar yo'q) -->
		<MkResult v-else type="empty"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';

// Sahifa ma'lumotlarini belgilash
definePage(() => ({
	title: i18n.ts.ads,
	icon: 'ti ti-ad',
}));
</script>
