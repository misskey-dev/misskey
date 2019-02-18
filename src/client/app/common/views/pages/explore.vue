<template>
<div>
	<ui-container :show-header="false">
		<div class="kpdsmpnk" :style="{ backgroundImage: meta.bannerUrl ? `url(${meta.bannerUrl})` : null }">
			<div>
				<b>{{ $t('explore', { host: meta.name }) }}</b>
				<span>{{ $t('users-info', { users: num(stats.originalUsersCount) }) }}</span>
			</div>
		</div>
	</ui-container>

	<mk-user-list v-if="tag != null" :make-promise="tagUsers" :key="`${tag}-local`">
		<fa :icon="faHashtag" fixed-width/>{{ tag }}
	</mk-user-list>
	<mk-user-list v-if="tag != null" :make-promise="tagRemoteUsers" :key="`${tag}-remote`">
		<fa :icon="faHashtag" fixed-width/>{{ tag }} ({{ $t('federated') }})
	</mk-user-list>

	<ui-container :body-togglable="true">
		<template #header><fa :icon="faHashtag" fixed-width/>{{ $t('popular-tags') }}</template>

		<div class="vxjfqztj">
			<router-link v-for="tag in tagsLocal" :to="`/explore/tags/${tag.tag}`" :key="tag.tag" class="local">{{ tag.tag }}</router-link>
			<router-link v-for="tag in tagsRemote" :to="`/explore/tags/${tag.tag}`" :key="tag.tag">{{ tag.tag }}</router-link>
		</div>
	</ui-container>

	<template v-if="tag == null">
		<mk-user-list :make-promise="verifiedUsers">
			<fa :icon="faBookmark" fixed-width/>{{ $t('verified-users') }}
		</mk-user-list>
		<mk-user-list :make-promise="popularUsers">
			<fa :icon="faChartLine" fixed-width/>{{ $t('popular-users') }}
		</mk-user-list>
		<mk-user-list :make-promise="recentlyUpdatedUsers">
			<fa :icon="faCommentAlt" fixed-width/>{{ $t('recently-updated-users') }}
		</mk-user-list>
		<mk-user-list :make-promise="recentlyRegisteredUsers">
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
			verifiedUsers: () => this.$root.api('users', {
				state: 'verified',
				origin: 'local',
				sort: '+follower',
				limit: 10
			}),
			popularUsers: () => this.$root.api('users', {
				state: 'alive',
				origin: 'local',
				sort: '+follower',
				limit: 10
			}),
			recentlyUpdatedUsers: () => this.$root.api('users', {
				origin: 'local',
				sort: '+updatedAt',
				limit: 10
			}),
			recentlyRegisteredUsers: () => this.$root.api('users', {
				origin: 'local',
				state: 'alive',
				sort: '+createdAt',
				limit: 10
			}),
			tagsLocal: [],
			tagsRemote: [],
			stats: null,
			meta: null,
			num: Vue.filter('number'),
			faBookmark, faChartLine, faCommentAlt, faPlus, faHashtag
		};
	},

	computed: {
		tagUsers(): () => Promise<any> {
			return () => this.$root.api('hashtags/users', {
				tag: this.tag,
				state: 'alive',
				origin: 'local',
				sort: '+follower',
				limit: 30
			});
		},

		tagRemoteUsers(): () => Promise<any> {
			return () => this.$root.api('hashtags/users', {
				tag: this.tag,
				state: 'alive',
				origin: 'remote',
				sort: '+follower',
				limit: 30
			});
		},
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
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	}
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

		> b
			display block
			font-size 20px
			font-weight bold

		> span
			font-size 14px
			opacity 0.8

</style>
