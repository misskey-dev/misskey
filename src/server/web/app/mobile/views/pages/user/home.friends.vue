<template>
<div class="root friends">
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-frequently-replied-users.loading%<mk-ellipsis/></p>
	<div v-if="!fetching && users.length > 0">
		<mk-user-card v-for="user in users" :key="user.id" :user="user"/>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">%i18n:mobile.tags.mk-user-overview-frequently-replied-users.no-users%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			users: []
		};
	},
	mounted() {
		(this as any).api('users/get_frequently_replied_users', {
			userId: this.user.id
		}).then(res => {
			this.users = res.map(x => x.user);
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root.friends
	> div
		overflow-x scroll
		-webkit-overflow-scrolling touch
		white-space nowrap
		padding 8px

		> .mk-user-card
			&:not(:last-child)
				margin-right 8px

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

</style>
