<template>
<div>
	<ui-container :show-header="false" v-if="meta && stats">
		<div class="kpdsmpnk" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }">
			<div>
				<router-link to="/explore" class="title">{{ $t('explore', { host: meta.name || 'Misskey' }) }}</router-link>
				<span>{{ $t('users-info', { users: num(stats.originalUsersCount) }) }}</span>
			</div>
		</div>
	</ui-container>

	<ui-container :body-togglable="true" :expanded="tag == null" ref="tags">
		<template #header><fa :icon="faHashtag" fixed-width/>{{ $t('popular-tags') }}</template>

		<div class="vxjfqztj">
			<router-link v-for="tag in tagsLocal" :to="`/explore/tags/${tag.tag}`" :key="'local:' + tag.tag" class="local">{{ tag.tag }}</router-link>
			<router-link v-for="tag in tagsRemote" :to="`/explore/tags/${tag.tag}`" :key="'remote:' + tag.tag">{{ tag.tag }}</router-link>
		</div>
	</ui-container>

	<mk-user-list v-if="tag != null" :pagination="tagUsers" :key="`${tag}-local`">
		<fa :icon="faHashtag" fixed-width/>{{ tag }}
	</mk-user-list>
	<mk-user-list v-if="tag != null" :pagination="tagRemoteUsers" :key="`${tag}-remote`">
		<fa :icon="faHashtag" fixed-width/>{{ tag }} ({{ $t('federated') }})
	</mk-user-list>

	<template v-if="tag == null">
		<mk-user-list :pagination="pinnedUsers">
			<fa :icon="faBookmark" fixed-width/>{{ $t('pinned-users') }}
		</mk-user-list>
		<mk-user-list :pagination="popularUsers">
			<fa :icon="faChartLine" fixed-width/>{{ $t('popular-users') }}
		</mk-user-list>
		<mk-user-list :pagination="recentlyUpdatedUsers">
			<fa :icon="faCommentAlt" fixed-width/>{{ $t('recently-updated-users') }}
		</mk-user-list>
		<mk-user-list :pagination="recentlyRegisteredUsers">
			<fa :icon="faPlus" fixed-width/>{{ $t('recently-registered-users') }}
		</mk-user-list>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faChartLine, faPlus, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/pages/explore.vue'),

	props: {
		tag: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			pinnedUsers: { endpoint: 'pinned-users' },
			popularUsers: { endpoint: 'users', limit: 10, params: {
				state: 'alive',
				origin: 'local',
				sort: '+follower',
			} },
			recentlyUpdatedUsers: { endpoint: 'users', limit: 10, params: {
				origin: 'local',
				sort: '+updatedAt',
			} },
			recentlyRegisteredUsers: { endpoint: 'users', limit: 10, params: {
				origin: 'local',
				state: 'alive',
				sort: '+createdAt',
			} },
			tagsLocal: [],
			tagsRemote: [],
			stats: null,
			meta: null,
			num: Vue.filter('number'),
			faBookmark, faChartLine, faCommentAlt, faPlus, faHashtag
		};
	},

	computed: {
		tagUsers(): any {
			return {
				endpoint: 'hashtags/users',
				limit: 30,
				params: {
					tag: this.tag,
					state: 'alive',
					origin: 'local',
					sort: '+follower',
				}
			};
		},

		tagRemoteUsers(): any {
			return {
				endpoint: 'hashtags/users',
				limit: 30,
				params: {
					tag: this.tag,
					state: 'alive',
					origin: 'remote',
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
		this.$emit('init', {
			title: this.$t('@.explore'),
			icon: faHashtag
		});
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
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	},

	mounted() {
		document.title = this.$root.instanceName;
	},
});
</script>

<style lang="stylus" scoped>
.vxjfqztj
	padding 16px

	> *
		margin-right 16px

		&.local
			font-weight bold

.kpdsmpnk
	min-height 100px
	padding 16px
	background-position center
	background-size cover

	&:before
		content ""
		display block
		position absolute
		top 0
		left 0
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.3)

	> div
		color #fff
		text-shadow 0 0 8px #00

		> .title
			display block
			font-size 20px
			font-weight bold
			color inherit

		> span
			font-size 14px
			opacity 0.8

</style>
