<template>
<MkSpacer :content-max="1200">
	<MkTab v-model="origin" style="margin-bottom: var(--margin);">
		<option value="local">{{ $ts.local }}</option>
		<option value="remote">{{ $ts.remote }}</option>
	</MkTab>
	<div v-if="origin === 'local'">
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
	<div v-else>
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
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XUserList from '@/components/user-list.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkTab from '@/components/tab.vue';
import number from '@/filters/number';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

const props = defineProps<{
	tag?: string;
}>();

let origin = $ref('local');
let tagsEl = $ref<InstanceType<typeof MkFolder>>();
let tagsLocal = $ref([]);
let tagsRemote = $ref([]);

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
</script>

<style lang="scss" scoped>
.vxjfqztj {
	> * {
		margin-right: 16px;

		&.local {
			font-weight: bold;
		}
	}
}
</style>
