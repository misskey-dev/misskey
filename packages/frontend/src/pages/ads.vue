<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>

	<MkSpacer :content-max="500">
		<div class="_gaps">
			<MkAd v-for="ad in instance.ads" :key="ad.id" :specify="ad"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

definePageMetadata({
	title: i18n.ts.ads,
	icon: 'ti ti-ad',
});
</script>

