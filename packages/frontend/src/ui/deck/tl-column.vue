<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="() => timeline.reloadTimeline()">
	<template #header>
		<i v-if="column.tl === 'home'" class="ti ti-home"></i>
		<i v-else-if="column.tl === 'local'" class="ti ti-planet"></i>
		<i v-else-if="column.tl === 'social'" class="ti ti-universe"></i>
		<i v-else-if="column.tl === 'global'" class="ti ti-whirl"></i>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<div v-if="(((column.tl === 'local' || column.tl === 'social') && !isLocalTimelineAvailable) || (column.tl === 'global' && !isGlobalTimelineAvailable))" :class="$style.disabled">
		<p :class="$style.disabledTitle">
			<i class="ti ti-circle-minus"></i>
			{{ i18n.ts._disabledTimeline.title }}
		</p>
		<p :class="$style.disabledDescription">{{ i18n.ts._disabledTimeline.description }}</p>
	</div>
	<MkTimeline
		v-else-if="column.tl"
		ref="timeline"
		:key="column.tl + withRenotes + withReplies + onlyFiles"
		:src="column.tl"
		:withRenotes="withRenotes"
		:withReplies="withReplies"
		:onlyFiles="onlyFiles"
	/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref, shallowRef } from 'vue';
import XColumn from './column.vue';
import { removeColumn, updateColumn, Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const disabled = ref(false);
const timeline = shallowRef<InstanceType<typeof MkTimeline>>();

const isLocalTimelineAvailable = (($i == null && instance.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable));
const isGlobalTimelineAvailable = (($i == null && instance.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable));
const withRenotes = ref(props.column.withRenotes ?? true);
const withReplies = ref(props.column.withReplies ?? false);
const onlyFiles = ref(props.column.onlyFiles ?? false);

watch(withRenotes, v => {
	updateColumn(props.column.id, {
		withRenotes: v,
	});
});

watch(withReplies, v => {
	updateColumn(props.column.id, {
		withReplies: v,
	});
});

watch(onlyFiles, v => {
	updateColumn(props.column.id, {
		onlyFiles: v,
	});
});

onMounted(() => {
	if (props.column.tl == null) {
		setType();
	} else if ($i) {
		disabled.value = (
			(!((instance.policies.ltlAvailable) || ($i.policies.ltlAvailable)) && ['local', 'social'].includes(props.column.tl)) ||
			(!((instance.policies.gtlAvailable) || ($i.policies.gtlAvailable)) && ['global'].includes(props.column.tl)));
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
}, {
	type: 'switch',
	text: i18n.ts.showRenotes,
	ref: withRenotes,
}, props.column.tl === 'local' || props.column.tl === 'social' ? {
	type: 'switch',
	text: i18n.ts.showRepliesToOthersInTimeline,
	ref: withReplies,
	disabled: onlyFiles,
} : undefined, {
	type: 'switch',
	text: i18n.ts.fileAttachedOnly,
	ref: onlyFiles,
	disabled: props.column.tl === 'local' || props.column.tl === 'social' ? withReplies : false,
}];
</script>

<style lang="scss" module>
.disabled {
	text-align: center;
}

.disabledTitle {
	margin: 16px;
}

.disabledDescription {
	font-size: 90%;
}
</style>
