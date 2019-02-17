<template>
<div>
	<mk-user-list v-if="tag != null" :make-promise="tagUsers" :key="tag">
		<fa :icon="faHashtag" fixed-width/>{{ tag }}
	</mk-user-list>
	<mk-user-list v-if="tag != null" :make-promise="tagRemoteUsers" :key="tag">
		<fa :icon="faHashtag" fixed-width/>{{ tag }} ({{ $t('federated') }})
	</mk-user-list>

	<ui-container :body-togglable="true">
		<template slot="header"><fa :icon="faHashtag" fixed-width/>{{ $t('popular-tags') }}</template>

		<div class="vxjfqztj">
			<router-link v-for="tag in tags" :to="`/explore/tags/${tag.tag}`" :key="tag.tag">{{ tag.tag }}</router-link>
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
			tags: [],
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
			limit: 30
		}).then(tags => {
			this.tags = tags;
		});
	}
});
</script>

<style lang="stylus" scoped>
.vxjfqztj
	padding 16px

	> *
		margin-right 16px

</style>
