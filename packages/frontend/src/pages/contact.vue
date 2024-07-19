<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="600" :marginMin="20">
		<div class="_gaps_m">
			<MkKeyValue :copy="instance.maintainerName">
				<template #key>{{ i18n.ts.administrator }}</template>
				<template #value>
					<template v-if="instance.maintainerName">{{ instance.maintainerName }}</template>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="instance.maintainerEmail">
				<template #key>{{ i18n.ts.contact }}</template>
				<template #value>
					<template v-if="instance.maintainerEmail">{{ instance.maintainerEmail }}</template>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="instance.inquiryUrl">
				<template #key>{{ i18n.ts.inquiry }}</template>
				<template #value>
					<MkLink v-if="instance.inquiryUrl" :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkLink from '@/components/MkLink.vue';

definePageMetadata(() => ({
	title: i18n.ts.inquiry,
	icon: 'ti ti-help-circle',
}));
</script>
