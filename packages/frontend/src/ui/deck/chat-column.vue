<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-messages" style="margin-right: 8px;"></i>{{ column.name || i18n.ts._deck._columns.chat }}</template>

	<div style="padding: 8px;">
		<MkChatHistories/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '../../i18n.js';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import MkChatHistories from '@/components/MkChatHistories.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();
</script>
