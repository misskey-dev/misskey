<template>
<div class="xprsixdl _root">
	<div>
		<div class="_isolated">
			<MkInput v-model:value="query" :debounce="true" type="search"><template #icon><Fa :icon="faSearch"/></template><span>{{ $ts.searchUser }}</span></MkInput>
		</div>

		<XUserList v-if="query" class="_gap" :pagination="searchPagination" ref="search"/>

		<MkFolder class="_gap">
			<template #header><Fa :icon="faChartLine" fixed-width style="margin-right: 0.5em;"/>{{ $ts.popularUsers }}</template>
			<MkPagination :pagination="featuredPagesPagination" #default="{items}">
				<MkPagePreview v-for="page in items" class="ckltabjg" :page="page" :key="page.id"/>
			</MkPagination>
		</MkFolder>
		<MkFolder class="_gap">
			<template #header><Fa :icon="faCommentAlt" fixed-width style="margin-right: 0.5em;"/>{{ $ts.recentlyUpdatedUsers }}</template>
			<XUserList :pagination="recentlyUpdatedUsers"/>
		</MkFolder>
		<MkFolder class="_gap">
			<template #header><Fa :icon="faPlus" fixed-width style="margin-right: 0.5em;"/>{{ $ts.recentlyRegisteredUsers }}</template>
			<XUserList :pagination="recentlyRegisteredUsers"/>
		</MkFolder>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faChartLine, faPlus, faHashtag, faRocket, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';
import XUserList from '@client/components/user-list.vue';
import MkFolder from '@client/components/ui/folder.vue';
import MkInput from '@client/components/ui/input.vue';
import number from '@client/filters/number';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XUserList,
		MkFolder,
		MkInput,
	},

	props: {
		tag: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.explore,
				icon: faHashtag
			},
			pinnedUsers: { endpoint: 'pinned-users' },
			popularUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				state: 'alive',
				origin: 'local',
				sort: '+follower',
			} },
			recentlyUpdatedUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'local',
				sort: '+updatedAt',
			} },
			recentlyRegisteredUsers: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'local',
				state: 'alive',
				sort: '+createdAt',
			} },
			popularUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				state: 'alive',
				origin: 'remote',
				sort: '+follower',
			} },
			recentlyUpdatedUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'combined',
				sort: '+updatedAt',
			} },
			recentlyRegisteredUsersF: { endpoint: 'users', limit: 10, noPaging: true, params: {
				origin: 'combined',
				sort: '+createdAt',
			} },
			searchPagination: {
				endpoint: 'users/search',
				limit: 10,
				params: computed(() => (this.query && this.query !== '') ? {
					query: this.query
				} : null)
			},
			tagsLocal: [],
			tagsRemote: [],
			stats: null,
			query: null,
			num: number,
			faBookmark, faChartLine, faCommentAlt, faPlus, faHashtag, faRocket, faSearch,
		};
	},

	computed: {
		meta() {
			return this.$instance;
		},
		tagUsers(): any {
			return {
				endpoint: 'hashtags/users',
				limit: 30,
				params: {
					tag: this.tag,
					origin: 'combined',
					sort: '+follower',
				}
			};
		},
	},

	watch: {
		tag() {
			if (this.$refs.tags) this.$refs.tags.toggleContent(this.tag == null);
		},
	},

	created() {
		os.api('hashtags/list', {
			sort: '+attachedLocalUsers',
			attachedToLocalUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsLocal = tags;
		});
		os.api('hashtags/list', {
			sort: '+attachedRemoteUsers',
			attachedToRemoteUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsRemote = tags;
		});
		os.api('stats').then(stats => {
			this.stats = stats;
		});
	},
});
</script>

<style lang="scss" scoped>
.xprsixdl {
	max-width: 1400px;
	margin: 0 auto;
}

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
