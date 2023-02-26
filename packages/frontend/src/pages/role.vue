<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>

	<MkSpacer :content-max="1200">
		<div class="_gaps_s">
			<div v-if="role">{{ role.description }}</div>
			<MkUserList :pagination="users" :extractor="(item) => item.user"/>
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
	role: string;
}>();

let role = $ref();

watch(() => props.role, () => {
	os.api('roles/show', {
		roleId: props.role,
	}).then(res => {
		role = res;
	});
}, { immediate: true });

const users = $computed(() => ({
	endpoint: 'roles/users' as const,
	limit: 30,
	params: {
		roleId: props.role,
	},
}));

definePageMetadata(computed(() => ({
	title: role?.name,
	icon: 'ti ti-badge',
})));
</script>

