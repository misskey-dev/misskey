<template>
<div class="mk-user-friends">
	<p class="title">%fa:users%%i18n:desktop.tags.mk-user.frequently-replied-users.title%</p>
	<p class="initializing" v-if="fetching">%fa:spinner .pulse .fw%%i18n:desktop.tags.mk-user.frequently-replied-users.loading%<mk-ellipsis/></p>
	<div class="user" v-if="!fetching && users.length != 0" each={ _user in users }>
		<a class="avatar-anchor" href={ '/' + _user.username }>
			<img class="avatar" src={ _user.avatar_url + '?thumbnail&size=42' } alt="" data-user-preview={ _user.id }/>
		</a>
		<div class="body">
			<a class="name" href={ '/' + _user.username } data-user-preview={ _user.id }>{ _user.name }</a>
			<p class="username">@{ _user.username }</p>
		</div>
		<mk-follow-button user={ _user }/>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">%i18n:desktop.tags.mk-user.frequently-replied-users.no-users%</p>
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
		this.$root.$data.os.api('users/get_frequently_replied_users', {
			user_id: this.user.id,
			limit: 4
		}).then(docs => {
			this.fetching = false;
			this.users = docs.map(doc => doc.user);
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-friends
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

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

	> .user
		padding 16px
		border-bottom solid 1px #eee

		&:last-child
			border-bottom none

		&:after
			content ""
			display block
			clear both

		> .avatar-anchor
			display block
			float left
			margin 0 12px 0 0

			> .avatar
				display block
				width 42px
				height 42px
				margin 0
				border-radius 8px
				vertical-align bottom

		> .body
			float left
			width calc(100% - 54px)

			> .name
				margin 0
				font-size 16px
				line-height 24px
				color #555

			> .username
				display block
				margin 0
				font-size 15px
				line-height 16px
				color #ccc

		> .mk-follow-button
			position absolute
			top 16px
			right 16px

</style>
