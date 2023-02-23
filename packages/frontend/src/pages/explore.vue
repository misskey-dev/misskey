<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<div class="lznhrdub">
		<div v-if="tab === 'featured'">
			<XFeatured/>
		</div>
		<div v-else-if="tab === 'users'">
			<XUsers/>
		</div>
		<div v-else-if="tab === 'roles'">
			<XRoles/>
		</div>
		<div v-else-if="tab === 'search'">
			<MkSpacer :content-max="1200">
				<div>
					<MkInput v-model="searchQuery" :debounce="true" type="search">
						<template #prefix><i class="ti ti-search"></i></template>
						<template #label>{{ i18n.ts.searchUser }}</template>
					</MkInput>
					<MkRadios v-model="searchOrigin">
						<option value="combined">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.local }}</option>
						<option value="remote">{{ i18n.ts.remote }}</option>
					</MkRadios>
				</div>

				<MkUserList v-if="searchQuery" ref="searchEl" class="_margin" :pagination="searchPagination"/>
			</MkSpacer>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import XRoles from './explore.roles.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import MkUserList from '@/components/MkUserList.vue';

const props = withDefaults(defineProps<{
	tag?: string;
	initialTab?: string;
}>(), {
	initialTab: 'featured',
});

let tab = $ref(props.initialTab);
let tagsEl = $shallowRef<InstanceType<typeof MkFoldableSection>>();
let searchQuery = $ref(null);
let searchOrigin = $ref('combined');

watch(() => props.tag, () => {
	if (tagsEl) tagsEl.toggleContent(props.tag == null);
});

const searchPagination = {
	endpoint: 'users/search' as const,
	limit: 10,
	params: computed(() => (searchQuery && searchQuery !== '') ? {
		query: searchQuery,
		origin: searchOrigin,
	} : null),
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
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
}, {
	key: 'search',
	icon: 'ti ti-search',
	title: i18n.ts.search,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
})));
</script>
