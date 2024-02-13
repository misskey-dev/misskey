<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkTooltip ref="tooltip" :showing="showing" :targetElement="targetElement" :maxWidth="340" @closed="emit('closed')">
	<div :class="$style.root">
		<MkReactionIcon :reaction="reaction" :class="$style.icon" :noStyle="true"/>
		<div :class="$style.name">{{ reaction.replace('@.', '') }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './MkTooltip.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';

defineProps<{
	showing: boolean;
	reaction: string;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.root {
	text-align: center;
}

.icon {
	display: block;
	width: 60px;
	font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
	margin: 0 auto;
	object-fit: contain;
}

.name {
	font-size: 0.9em;
}
</style>
