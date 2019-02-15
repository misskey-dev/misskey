<template>
<div>
	<mk-user-list :users="verifiedUsers">
		<span><fa :icon="faBookmark"/> {{ $t('verified-users') }}</span>
	</mk-user-list>
	<mk-user-list :users="popularUsers">
		<span><fa :icon="faChartLine"/> {{ $t('popular-users') }}</span>
	</mk-user-list>
	<mk-user-list :users="recentlyUpdatedUsers">
		<span><fa :icon="faCommentAlt"/> {{ $t('recently-updated-users') }}</span>
	</mk-user-list>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { faBookmark, faCommentAlt } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/pages/explore.vue'),

	data() {
		return {
			verifiedUsers: [],
			popularUsers: [],
			recentlyUpdatedUsers: [],
			faBookmark, faChartLine, faCommentAlt
		};
	},

	created() {
		this.$root.api('users', {
			state: 'verified',
			origin: 'local',
			sort: '+follower',
			limit: 10
		}).then(users => {
			this.verifiedUsers = users;
		});

		this.$root.api('users', {
			state: 'alive',
			origin: 'local',
			sort: '+follower',
			limit: 10
		}).then(users => {
			this.popularUsers = users;
		});

		this.$root.api('users', {
			origin: 'local',
			sort: '+updatedAt',
			limit: 10
		}).then(users => {
			this.recentlyUpdatedUsers = users;
		});
	}
});
</script>

<style lang="stylus" scoped>
</style>
