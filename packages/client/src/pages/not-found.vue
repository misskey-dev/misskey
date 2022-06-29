<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img src="/static-assets/badges/not-found.jpg" class="_ghost" alt="Not found"/>
		<div>{{ $ts.notFoundDescription }}</div>
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
	icon: 'fas fa-exclamation-triangle',
	bg: 'var(--bg)',
});
</script>
