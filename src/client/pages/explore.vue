<template>
<div class="_section">
	<div class="localfedi7 _panel" v-if="meta && stats && tag == null" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }">
		<header><span>{{ $t('explore', { host: meta.name || 'Misskey' }) }}</span></header>
		<div><span>{{ $t('exploreUsersCount', { count: num(stats.originalUsersCount) }) }}</span></div>
	</div>

	<template v-if="tag == null">
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faBookmark" fixed-width style="margin-right: 0.5em;"/>{{ $t('pinnedUsers') }}</template>
			<XUserList :pagination="pinnedUsers"/>
		</MkFolder>
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faChartLine" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularUsers') }}</template>
			<XUserList :pagination="popularUsers"/>
		</MkFolder>
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faCommentAlt" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyUpdatedUsers') }}</template>
			<XUserList :pagination="recentlyUpdatedUsers"/>
		</MkFolder>
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faPlus" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyRegisteredUsers') }}</template>
			<XUserList :pagination="recentlyRegisteredUsers"/>
		</MkFolder>
	</template>

	<div class="localfedi7 _panel _vMargin" v-if="tag == null" :style="{ backgroundImage: `url(/assets/fedi.jpg)`, marginTop: 'var(--margin)' }">
		<header><span>{{ $t('exploreFediverse') }}</span></header>
	</div>

	<MkFolder :body-togglable="true" :expanded="false" ref="tags" class="_vMargin">
		<template #header><Fa :icon="faHashtag" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularTags') }}</template>

		<div class="vxjfqztj">
			<router-link v-for="tag in tagsLocal" :to="`/explore/tags/${tag.tag}`" :key="'local:' + tag.tag" class="local">{{ tag.tag }}</router-link>
			<router-link v-for="tag in tagsRemote" :to="`/explore/tags/${tag.tag}`" :key="'remote:' + tag.tag">{{ tag.tag }}</router-link>
		</div>
	</MkFolder>

	<MkFolder v-if="tag != null" :key="`${tag}`" class="_vMargin">
		<template #header><Fa :icon="faHashtag" fixed-width style="margin-right: 0.5em;"/>{{ tag }}</template>
		<XUserList :pagination="tagUsers"/>
	</MkFolder>

	<template v-if="tag == null">
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faChartLine" fixed-width style="margin-right: 0.5em;"/>{{ $t('popularUsers') }}</template>
			<XUserList :pagination="popularUsersF"/>
		</MkFolder>
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faCommentAlt" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyUpdatedUsers') }}</template>
			<XUserList :pagination="recentlyUpdatedUsersF"/>
		</MkFolder>
		<MkFolder class="_vMargin">
			<template #header><Fa :icon="faRocket" fixed-width style="margin-right: 0.5em;"/>{{ $t('recentlyDiscoveredUsers') }}</template>
			<XUserList :pagination="recentlyRegisteredUsersF"/>
		</MkFolder>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChartLine, faPlus, faHashtag, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';
import XUserList from '@/components/user-list.vue';
import MkFolder from '@/components/ui/folder.vue';
import number from '@/filters/number';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('explore') as string
		};
	},

	components: {
		XUserList,
		MkFolder,
	},

	props: {
		tag: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('explore'),
					icon: faHashtag
				}],
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
