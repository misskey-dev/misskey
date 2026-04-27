<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 500px;">
		<div v-if="instance.ads.length > 0" class="_gaps">
			<MkAd v-for="ad in instance.ads" :key="ad.id" :specify="ad"/>
		</div>
		<MkResult v-else type="empty"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';

definePage(() => ({
	title: i18n.ts.ads,
	icon: 'ti ti-ad',
}));
</script>

