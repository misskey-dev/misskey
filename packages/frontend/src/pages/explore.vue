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
		<div v-else-if="tab === 'search'">
			<MkSpacer :content-max="1200">
				<div>
					<MkInput v-model="searchQuery" :debounce="true" type="search" class="_formBlock">
						<template #prefix><i class="ti ti-search"></i></template>
						<template #label>{{ i18n.ts.searchUser }}</template>
					</MkInput>
					<MkRadios v-model="searchOrigin" class="_formBlock">
						<option value="combined">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.local }}</option>
						<option value="remote">{{ i18n.ts.remote }}</option>
					</MkRadios>
				</div>

				<XUserList v-if="searchQuery" ref="searchEl" class="_gap" :pagination="searchPagination"/>
			</MkSpacer>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/form/input.vue';
import MkRadios from '@/components/form/radios.vue';
import number from '@/filters/number';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import XUserList from '@/components/MkUserList.vue';

const props = defineProps<{
	tag?: string;
}>();

let tab = $ref('featured');
let tagsEl = $ref<InstanceType<typeof MkFolder>>();
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
	key: 'search',
	title: i18n.ts.search,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
})));
</script>
