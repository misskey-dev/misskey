<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<div>
		<div v-if="tab === 'featured'">
			<XFeatured/>
		</div>
		<div v-else-if="tab === 'users'">
			<XUsers/>
		</div>
		<div v-else-if="tab === 'roles'">
			<XRoles/>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref, shallowRef } from 'vue';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import XRoles from './explore.roles.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	tag?: string;
	initialTab?: string;
}>(), {
	initialTab: 'featured',
});

const tab = ref(props.initialTab);
const tagsEl = shallowRef<InstanceType<typeof MkFoldableSection>>();

watch(() => props.tag, () => {
	if (tagsEl.value) tagsEl.value.toggleContent(props.tag == null);
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'featured',
	icon: 'ti ti-bolt',
	title: i18n.ts.featured,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}, {
	key: 'roles',
	icon: 'ti ti-badges',
	title: i18n.ts.roles,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
})));
</script>
