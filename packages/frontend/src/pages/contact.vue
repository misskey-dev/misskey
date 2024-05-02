<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="600" :marginMin="20">
		<div>{{ instance.maintainerEmail }}</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { instance } from '@/instance.js';

definePageMetadata(() => ({
	title: i18n.ts.inquiry,
	icon: 'ti ti-help-circle',
}));
</script>
