<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>

	<MkSpacer v-if="tab === 'users'" :content-max="1200">
		<div class="_gaps_s">
			<div v-if="role">{{ role.description }}</div>
			<MkUserList :pagination="users" :extractor="(item) => item.user"/>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'timeline'" :content-max="700">
		<MkTimeline ref="timeline" src="role" :role="props.role"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as os from '@/os';
import MkUserList from '@/components/MkUserList.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import MkTimeline from '@/components/MkTimeline.vue';

const props = withDefaults(defineProps<{
	role: string;
	initialTab?: string;
}>(), {
	initialTab: 'users',
});

let tab = $ref(props.initialTab);
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

const headerTabs = $computed(() => [{
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}, {
	key: 'timeline',
	icon: 'ti ti-pencil',
	title: i18n.ts.timeline,
}]);

definePageMetadata(computed(() => ({
	title: role?.name,
	icon: 'ti ti-badge',
})));
</script>

