<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="1200">
		<div class="lznhrdub">
			<div v-if="tab === 'local'">
				<div v-if="instance && stats && tag == null" class="localfedi7 _block _isolated" :style="{ backgroundImage: instance.bannerUrl ? `url(${instance.bannerUrl})` : null }">
					<header><span>{{ $t('explore', { host: instance.name || 'Misskey' }) }}</span></header>
					<div><span>{{ $t('exploreUsersCount', { count: number(stats.originalUsersCount) }) }}</span></div>
				</div>

				<template v-if="tag == null">
					<MkFolder class="_gap" persist-key="explore-pinned-users">
						<template #header><i class="fas fa-bookmark fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.pinnedUsers }}</template>
						<XUserList :pagination="pinnedUsers"/>
					</MkFolder>
					<MkFolder class="_gap" persist-key="explore-popular-users">
						<template #header><i class="fas fa-chart-line fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.popularUsers }}</template>
						<XUserList :pagination="popularUsers"/>
					</MkFolder>
					<MkFolder class="_gap" persist-key="explore-recently-updated-users">
						<template #header><i class="fas fa-comment-alt fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.recentlyUpdatedUsers }}</template>
						<XUserList :pagination="recentlyUpdatedUsers"/>
					</MkFolder>
					<MkFolder class="_gap" persist-key="explore-recently-registered-users">
						<template #header><i class="fas fa-plus fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.recentlyRegisteredUsers }}</template>
						<XUserList :pagination="recentlyRegisteredUsers"/>
					</MkFolder>
				</template>
			</div>
			<div v-else-if="tab === 'remote'">
				<div v-if="tag == null" class="localfedi7 _block _isolated" :style="{ backgroundImage: `url(/client-assets/fedi.jpg)` }">
					<header><span>{{ $ts.exploreFediverse }}</span></header>
				</div>

				<MkFolder ref="tagsEl" :foldable="true" :expanded="false" class="_gap">
					<template #header><i class="fas fa-hashtag fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.popularTags }}</template>

					<div class="vxjfqztj">
						<MkA v-for="tag in tagsLocal" :key="'local:' + tag.tag" :to="`/explore/tags/${tag.tag}`" class="local">{{ tag.tag }}</MkA>
						<MkA v-for="tag in tagsRemote" :key="'remote:' + tag.tag" :to="`/explore/tags/${tag.tag}`">{{ tag.tag }}</MkA>
					</div>
				</MkFolder>

				<MkFolder v-if="tag != null" :key="`${tag}`" class="_gap">
					<template #header><i class="fas fa-hashtag fa-fw" style="margin-right: 0.5em;"></i>{{ tag }}</template>
					<XUserList :pagination="tagUsers"/>
				</MkFolder>

				<template v-if="tag == null">
					<MkFolder class="_gap">
						<template #header><i class="fas fa-chart-line fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.popularUsers }}</template>
						<XUserList :pagination="popularUsersF"/>
					</MkFolder>
					<MkFolder class="_gap">
						<template #header><i class="fas fa-comment-alt fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.recentlyUpdatedUsers }}</template>
						<XUserList :pagination="recentlyUpdatedUsersF"/>
					</MkFolder>
					<MkFolder class="_gap">
						<template #header><i class="fas fa-rocket fa-fw" style="margin-right: 0.5em;"></i>{{ $ts.recentlyDiscoveredUsers }}</template>
						<XUserList :pagination="recentlyRegisteredUsersF"/>
					</MkFolder>
				</template>
			</div>
			<div v-else-if="tab === 'search'">
				<div class="_isolated">
					<MkInput v-model="searchQuery" :debounce="true" type="search">
						<template #prefix><i class="fas fa-search"></i></template>
						<template #label>{{ $ts.searchUser }}</template>
					</MkInput>
					<MkRadios v-model="searchOrigin">
						<option value="combined">{{ $ts.all }}</option>
						<option value="local">{{ $ts.local }}</option>
						<option value="remote">{{ $ts.remote }}</option>
					</MkRadios>
				</div>

				<XUserList v-if="searchQuery" ref="searchEl" class="_gap" :pagination="searchPagination"/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineComponent, watch } from 'vue';
import XUserList from '@/components/user-list.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkInput from '@/components/form/input.vue';
import MkRadios from '@/components/form/radios.vue';
import number from '@/filters/number';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

const props = defineProps<{
	tag?: string;
}>();

let tab = $ref('local');
let tagsEl = $ref<InstanceType<typeof MkFolder>>();
let tagsLocal = $ref([]);
let tagsRemote = $ref([]);
let stats = $ref(null);
let searchQuery = $ref(null);
let searchOrigin = $ref('combined');

watch(() => props.tag, () => {
	if (tagsEl) tagsEl.toggleContent(props.tag == null);
});

const tagUsers = $computed(() => ({
	endpoint: 'hashtags/users' as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
}));

const pinnedUsers = { endpoint: 'pinned-users' };
const popularUsers = { endpoint: 'users', limit: 10, noPaging: true, params: {
	state: 'alive',
	origin: 'local',
	sort: '+follower',
} };
const recentlyUpdatedUsers = { endpoint: 'users', limit: 10, noPaging: true, params: {
	origin: 'local',
	sort: '+updatedAt',
} };
const recentlyRegisteredUsers = { endpoint: 'users', limit: 10, noPaging: true, params: {
	origin: 'local',
	state: 'alive',
	sort: '+createdAt',
} };
const popularUsersF = { endpoint: 'users', limit: 10, noPaging: true, params: {
	state: 'alive',
	origin: 'remote',
	sort: '+follower',
} };
const recentlyUpdatedUsersF = { endpoint: 'users', limit: 10, noPaging: true, params: {
	origin: 'combined',
	sort: '+updatedAt',
} };
const recentlyRegisteredUsersF = { endpoint: 'users', limit: 10, noPaging: true, params: {
	origin: 'combined',
	sort: '+createdAt',
} };
const searchPagination = {
	endpoint: 'users/search' as const,
	limit: 10,
	params: computed(() => (searchQuery && searchQuery !== '') ? {
		query: searchQuery,
		origin: searchOrigin,
	} : null),
};

os.api('hashtags/list', {
	sort: '+attachedLocalUsers',
	attachedToLocalUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsLocal = tags;
});
os.api('hashtags/list', {
	sort: '+attachedRemoteUsers',
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsRemote = tags;
});
os.api('stats').then(_stats => {
	stats = _stats;
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	active: tab === 'local',
	title: i18n.ts.local,
	onClick: () => { tab = 'local'; },
}, {
	active: tab === 'remote',
	title: i18n.ts.remote,
	onClick: () => { tab = 'remote'; },
}, {
	active: tab === 'search',
	title: i18n.ts.search,
	onClick: () => { tab = 'search'; },
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'fas fa-hashtag',
	bg: 'var(--bg)',
})));
</script>

<style lang="scss" scoped>
.localfedi7 {
	color: #fff;
	padding: 16px;
	height: 80px;
	background-position: 50%;
	background-size: cover;
	margin-bottom: var(--margin);

	> * {
		&:not(:last-child) {
			margin-bottom: 8px;
		}

		> span {
			display: inline-block;
			padding: 6px 8px;
			background: rgba(0, 0, 0, 0.7);
		}
	}

	> header {
		font-size: 20px;
		font-weight: bold;
	}

	> div {
		font-size: 14px;
		opacity: 0.8;
	}
}

.vxjfqztj {
	> * {
		margin-right: 16px;

		&.local {
			font-weight: bold;
		}
	}
}
</style>
