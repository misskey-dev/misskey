<template>
<div class="mk-user-followers-you-know">
	<p class="title">%fa:users%%i18n:desktop.tags.mk-user.followers-you-know.title%</p>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:desktop.tags.mk-user.followers-you-know.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && users.length > 0">
	<template each={ user in users }>
		<a href={ '/' + user.username }><img src={ user.avatar_url + '?thumbnail&size=64' } alt={ user.name }/></a>
	</template>
	</div>
	<p class="empty" v-if="!initializing && users.length == 0">%i18n:desktop.tags.mk-user.followers-you-know.no-users%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			users: [],
			fetching: true
		};
	},
	mounted() {
		this.$root.$data.os.api('users/followers', {
			user_id: this.user.id,
			iknow: true,
			limit: 16
		}).then(x => {
			this.fetching = false;
			this.users = x.users;
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-followers-you-know
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> i
			margin-right 4px

	> div
		padding 8px

		> a
			display inline-block
			margin 4px

			> img
				width 48px
				height 48px
				vertical-align bottom
				border-radius 100%

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

</style>
