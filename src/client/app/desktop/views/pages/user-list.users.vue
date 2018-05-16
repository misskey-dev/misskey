<template>
<div>
	<mk-widget-container>
		<template slot="header">%fa:users% ユーザー</template>
		<button slot="func" title="ユーザーを追加" @click="add">%fa:plus%</button>

		<div data-id="d0b63759-a822-4556-a5ce-373ab966e08a">
			<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw% %i18n:common.loading%<mk-ellipsis/></p>
			<template v-else-if="users.length != 0">
				<div class="user" v-for="_user in users">
					<mk-avatar class="avatar" :user="_user"/>
					<div class="body">
						<router-link class="name" :to="_user | userPage" v-user-preview="_user.id">{{ _user | userName }}</router-link>
						<p class="username">@{{ _user | acct }}</p>
					</div>
				</div>
			</template>
			<p class="empty" v-else>%i18n:@no-one%</p>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		list: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			fetching: true,
			users: []
		};
	},
	mounted() {
		(this as any).api('users/show', {
			userIds: this.list.userIds
		}).then(users => {
			this.users = users;
			this.fetching = false;
		});
	},
	methods: {
		add() {
			(this as any).apis.input({
				title: 'ユーザー名',
			}).then(async username => {
				const user = await (this as any).api('users/show', {
					username
				});

				(this as any).api('users/lists/push', {
					listId: this.list.id,
					userId: user.id
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	> .user
		padding 16px
		border-bottom solid 1px isDark ? #1c2023 : #eee

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
				color isDark ? #fff : #555

			> .username
				display block
				margin 0
				font-size 15px
				line-height 16px
				color isDark ? #606984 : #ccc

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

[data-id="d0b63759-a822-4556-a5ce-373ab966e08a"][data-darkmode]
	root(true)

[data-id="d0b63759-a822-4556-a5ce-373ab966e08a"]:not([data-darkmode])
	root(false)

</style>
