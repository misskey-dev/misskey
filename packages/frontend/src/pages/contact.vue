<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="600" :marginMin="20">
		<div class="_gaps_m">
			<MkKeyValue :copy="serverMetadata.maintainerName">
				<template #key>{{ i18n.ts.administrator }}</template>
				<template #value>
					<template v-if="serverMetadata.maintainerName">{{ serverMetadata.maintainerName }}</template>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="serverMetadata.maintainerEmail">
				<template #key>{{ i18n.ts.contact }}</template>
				<template #value>
					<template v-if="serverMetadata.maintainerEmail">{{ serverMetadata.maintainerEmail }}</template>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="serverMetadata.inquiryUrl">
				<template #key>{{ i18n.ts.inquiry }}</template>
				<template #value>
					<MkLink v-if="serverMetadata.inquiryUrl" :url="serverMetadata.inquiryUrl" target="_blank">{{ serverMetadata.inquiryUrl }}</MkLink>
					<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
				</template>
			</MkKeyValue>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkLink from '@/components/MkLink.vue';

import { DI } from '@/di.js';

const serverMetadata = inject(DI.serverMetadata)!;

definePageMetadata(() => ({
	title: i18n.ts.inquiry,
	icon: 'ti ti-help-circle',
}));
</script>
