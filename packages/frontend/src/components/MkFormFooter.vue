<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.text">{{ i18n.tsx.thereAreNChanges({ n: form.modifiedCount.value }) }}</div>
	<div style="margin-left: auto;" class="_buttons">
		<MkButton danger rounded @click="form.discard"><i class="ti ti-x"></i> {{ i18n.ts.discard }}</MkButton>
		<MkButton primary rounded @click="form.save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from './MkButton.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	form: {
		modifiedCount: {
			value: number;
		};
		discard: () => void;
		save: () => void;
	};
}>();
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
}

.text {
	color: var(--warn);
	font-size: 90%;
	animation: modified-blink 2s infinite;
}

@keyframes modified-blink {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
}
</style>
