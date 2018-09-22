<template>
<div class="hozptpaliadatkehcmcayizwzwwctpbc">
	<p class="title">%fa:users%%i18n:@title%</p>
	<p class="initializing" v-if="fetching">%fa:spinner .pulse .fw%%i18n:@loading%<mk-ellipsis/></p>
	<template v-if="!fetching && users.length != 0">
		<div class="user" v-for="friend in users">
			<mk-avatar class="avatar" :user="friend"/>
			<div class="body">
				<router-link class="name" :to="friend | userPage" v-user-preview="friend.id">{{ friend.name }}</router-link>
				<p class="username">@{{ friend | acct }}</p>
			</div>
			<mk-follow-button :user="friend"/>
		</div>
	</template>
	<p class="empty" v-if="!fetching && users.length == 0">%i18n:@no-users%</p>
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
		(this as any).api('users/get_frequently_replied_users', {
			userId: this.user.id,
			limit: 4
		}).then(docs => {
			this.users = docs.map(doc => doc.user);
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	background isDark ? #282C37 : #fff
	box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)
	overflow hidden

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		background isDark ? #313543 : inherit
		color isDark ? #e3e5e8 : #888
		box-shadow 0 1px rgba(#000, 0.07)

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
		border-bottom solid 1px isDark ? #21242f : #eee

		&:last-child
			border-bottom none

		&:after
			content ""
			display block
			clear both

		> .avatar
			display block
			float left
			margin 0 12px 0 0
			width 42px
			height 42px
			border-radius 8px

		> .body
			float left
			width calc(100% - 54px)

			> .name
				margin 0
				font-size 16px
				line-height 24px
				color isDark ? #ccc : #555

			> .username
				display block
				margin 0
				font-size 15px
				line-height 16px
				color isDark ? #555 : #ccc

		> .mk-follow-button
			position absolute
			top 16px
			right 16px

.hozptpaliadatkehcmcayizwzwwctpbc[data-darkmode]
	root(true)

.hozptpaliadatkehcmcayizwzwwctpbc:not([data-darkmode])
	root(false)

</style>
