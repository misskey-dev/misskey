<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'featured'">
		<XFeatured/>
	</div>
	<div v-else-if="tab === 'users'">
		<XUsers/>
	</div>
	<div v-else-if="tab === 'illustration'">
		<XIllustration/>
	</div>
	<div v-else-if="tab === 'roles'">
		<XRoles/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import XRoles from './explore.roles.vue';
import XIllustration from './explore.illustration.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'featured',
});

// URLハッシュからタブを決定
const getInitialTab = () => {
	if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#')) {
		const hashTab = window.location.hash.substring(1);
		if (['featured', 'users', 'illustration', 'roles'].includes(hashTab)) {
			return hashTab;
		}
	}
	return props.initialTab;
};

const tab = ref(getInitialTab());

// タブが変更されたらURLハッシュを更新
watch(tab, (newTab) => {
	if (typeof window !== 'undefined') {
		window.location.hash = `#${newTab}`;
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'featured',
	icon: 'ti ti-bolt',
	title: i18n.ts.featured as string,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users as string,
}, {
	key: 'illustration',
	icon: 'ti ti-paint',
	title: i18n.ts.illustrations as string,
}, {
	key: 'roles',
	icon: 'ti ti-badges',
	title: i18n.ts.roles as string,
}]);

definePage(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
}));
</script>
