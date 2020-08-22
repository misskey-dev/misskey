<template>
<div>
	<teleport to="#_teleport_header"><fa :icon="faHashtag"/>{{ $t('explore') }}</teleport>

	<div class="localfedi7 _panel" v-if="meta && stats && tag == null" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }">
		<header><span>{{ $t('explore', { host: meta.name || 'Misskey' }) }}</span></header>
		<div><span>{{ $t('exploreUsersCount', { count: num(stats.originalUsersCount) }) }}</span></div>
	</div>

	<template v-if="tag == null">
		<x-user-list :pagination="pinnedUsers" :expanded="false">
			<fa :icon="faBookmark" fixed-width/>{{ $t('pinnedUsers') }}
		</x-user-list>
		<x-user-list :pagination="popularUsers" :expanded="false">
			<fa :icon="faChartLine" fixed-width/>{{ $t('popularUsers') }}
		</x-user-list>
		<x-user-list :pagination="recentlyUpdatedUsers" :expanded="false">
			<fa :icon="faCommentAlt" fixed-width/>{{ $t('recentlyUpdatedUsers') }}
		</x-user-list>
		<x-user-list :pagination="recentlyRegisteredUsers" :expanded="false">
			<fa :icon="faPlus" fixed-width/>{{ $t('recentlyRegisteredUsers') }}
		</x-user-list>
	</template>

	<div class="localfedi7 _panel" v-if="tag == null" :style="{ backgroundImage: `url(/assets/fedi.jpg)`, marginTop: 'var(--margin)' }">
		<header><span>{{ $t('exploreFediverse') }}</span></header>
	</div>

	<mk-container :body-togglable="true" :expanded="false" ref="tags">
		<template #header><fa :icon="faHashtag" fixed-width/>{{ $t('popularTags') }}</template>

		<div class="vxjfqztj">
			<router-link v-for="tag in tagsLocal" :to="`/explore/tags/${tag.tag}`" :key="'local:' + tag.tag" class="local">{{ tag.tag }}</router-link>
			<router-link v-for="tag in tagsRemote" :to="`/explore/tags/${tag.tag}`" :key="'remote:' + tag.tag">{{ tag.tag }}</router-link>
		</div>
	</mk-container>

	<x-user-list v-if="tag != null" :pagination="tagUsers" :key="`${tag}`">
		<fa :icon="faHashtag" fixed-width/>{{ tag }}
	</x-user-list>
	<template v-if="tag == null">
		<x-user-list :pagination="popularUsersF" :expanded="false">
			<fa :icon="faChartLine" fixed-width/>{{ $t('popularUsers') }}
		</x-user-list>
		<x-user-list :pagination="recentlyUpdatedUsersF" :expanded="false">
			<fa :icon="faCommentAlt" fixed-width/>{{ $t('recentlyUpdatedUsers') }}
		</x-user-list>
		<x-user-list :pagination="recentlyRegisteredUsersF" :expanded="false">
			<fa :icon="faRocket" fixed-width/>{{ $t('recentlyDiscoveredUsers') }}
		</x-user-list>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChartLine, faPlus, faHashtag, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';
import XUserList from '../components/user-list.vue';
import MkContainer from '../components/ui/container.vue';
import number from '../filters/number';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('explore') as string
		};
	},

	components: {
		XUserList,
		MkContainer,
	},

	props: {
		tag: {
			type: String,
			required: false
		}
	},

	data() {
		return {
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
			tagsLocal: [],
			tagsRemote: [],
			stats: null,
			num: number,
			faBookmark, faChartLine, faCommentAlt, faPlus, faHashtag, faRocket
		};
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
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
		}
	},

	created() {
		this.$root.api('hashtags/list', {
			sort: '+attachedLocalUsers',
			attachedToLocalUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsLocal = tags;
		});
		this.$root.api('hashtags/list', {
			sort: '+attachedRemoteUsers',
			attachedToRemoteUserOnly: true,
			limit: 30
		}).then(tags => {
			this.tagsRemote = tags;
		});
		this.$root.api('stats').then(stats => {
			this.stats = stats;
		});
	},
});
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
	padding: 16px;

	> * {
		margin-right: 16px;

		&.local {
			font-weight: bold;
		}
	}
}
</style>
