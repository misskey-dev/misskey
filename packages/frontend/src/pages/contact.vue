<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="600" :marginMin="20">
		<div class="_gaps">
			<MkKeyValue>
				<template #key>{{ i18n.ts.inquiry }}</template>
				<template #value>
					<MkLink :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
				</template>
			</MkKeyValue>

			<MkKeyValue>
				<template #key>{{ i18n.ts.email }}</template>
				<template #value>
					<div>{{ instance.maintainerEmail }}</div>
				</template>
			</MkKeyValue>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { instance } from '@/instance.js';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkLink from '@/components/MkLink.vue';

definePageMetadata(() => ({
	title: i18n.ts.inquiry,
	icon: 'ti ti-help-circle',
}));
</script>
