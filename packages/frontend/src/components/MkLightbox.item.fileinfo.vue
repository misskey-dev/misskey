<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.root" class="_gaps_s">
		<MkKeyValue v-if="content.filename != null">
			<template #key>{{ i18n.ts.fileName }}</template>
			<template #value>{{ content.filename }}</template>
		</MkKeyValue>
		<MkKeyValue v-if="content.file != null">
			<template #key>{{ i18n.ts.description }}</template>
			<template #value>
				<div :class="$style.pre">{{ content.file.comment ? content.file.comment : `(${i18n.ts.none})` }}</div>
			</template>
		</MkKeyValue>
	</div>
</template>

<script lang="ts" setup>
import MkKeyValue from '@/components/MkKeyValue.vue';
import { i18n } from '@/i18n.js';
import type { Content } from '@/components/MkLightbox.item.vue';

const props = defineProps<{
	content: Content;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 4px 14px;
}

.pre {
	white-space: pre-wrap;
}
</style>
