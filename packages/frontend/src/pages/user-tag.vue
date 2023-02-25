<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>

	<MkSpacer :content-max="1200">
		<div class="_gaps_s">
			<MkUserList :pagination="tagUsers"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as os from '@/os';
import MkUserList from '@/components/MkUserList.vue';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	tag: string;
}>();

const tagUsers = $computed(() => ({
	endpoint: 'hashtags/users' as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
}));

definePageMetadata(computed(() => ({
	title: props.tag,
	icon: 'ti ti-user-search',
})));
</script>

