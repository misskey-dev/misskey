<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked">
	<template #header>
		<i v-if="column.tl === 'home'" class="ti ti-home"></i>
		<i v-else-if="column.tl === 'local'" class="ti ti-planet"></i>
		<i v-else-if="column.tl === 'social'" class="ti ti-rocket"></i>
		<i v-else-if="column.tl === 'global'" class="ti ti-whirl"></i>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.tl" ref="timeline" :key="column.tl" :src="column.tl"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import XColumn from './column.vue';
import { removeColumn, updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

onMounted(() => {
	if (props.column.tl == null) {
		setType();
	}
});

async function setType() {
	const { canceled, result: src } = await os.select({
		title: i18n.ts.timeline,
		items: [{
			value: 'home' as const, text: i18n.ts._timelines.home,
		}, {
			value: 'local' as const, text: i18n.ts._timelines.local,
		}, {
			value: 'social' as const, text: i18n.ts._timelines.social,
		}, {
			value: 'global' as const, text: i18n.ts._timelines.global,
		}],
	});
	if (canceled) {
		if (props.column.tl == null) {
			removeColumn(props.column.id);
		}
		return;
	}
	updateColumn(props.column.id, {
		tl: src,
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.timeline,
	action: setType,
}];
</script>
