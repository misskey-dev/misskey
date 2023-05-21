<template>
<div>
	<div class="_fullinfo">
		<img src="https://na.nfs.pub/not-found.png" class="_ghost"/>
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.notFound,
	icon: 'ti ti-alert-triangle',
});
</script>
