<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 1200px;">
		<div class="_gaps_s">
			<MkUserList :pagination="tagUsers"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkUserList from '@/components/MkUserList.vue';
import { definePage } from '@/page.js';

const props = defineProps<{
	tag: string;
}>();

const tagUsers = computed(() => ({
	endpoint: 'hashtags/users' as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
}));

definePage(() => ({
	title: props.tag,
	icon: 'ti ti-user-search',
}));
</script>

