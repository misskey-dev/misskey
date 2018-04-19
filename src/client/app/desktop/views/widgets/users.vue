<template>
<div class="mkw-users">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:users%%i18n:@title%</template>
		<button slot="func" title="%i18n:@refresh%" @click="refresh">%fa:sync%</button>

		<div class="mkw-users--body" :data-darkmode="_darkmode_">
			<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
			<template v-else-if="users.length != 0">
				<div class="user" v-for="_user in users">
					<router-link class="avatar-anchor" :to="_user | userPage">
						<img class="avatar" :src="`${_user.avatarUrl}?thumbnail&size=42`" alt="" v-user-preview="_user.id"/>
					</router-link>
					<div class="body">
						<router-link class="name" :to="_user | userPage" v-user-preview="_user.id">{{ _user | userName }}</router-link>
						<p class="username">@{{ _user | acct }}</p>
					</div>
					<mk-follow-button :user="_user"/>
				</div>
			</template>
			<p class="empty" v-else>%i18n:@no-one%</p>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

const limit = 3;

export default define({
	name: 'users',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			users: [],
			fetching: true,
			page: 0
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
		},
		fetch() {
			this.fetching = true;
			this.users = [];

			(this as any).api('users/recommendation', {
				limit: limit,
				offset: limit * this.page
			}).then(users => {
				this.users = users;
				this.fetching = false;
			});
		},
		refresh() {
			if (this.users.length < limit) {
				this.page = 0;
			} else {
				this.page++;
			}
			this.fetch();
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
				color isDark ? #fff : #555

			> .username
				display block
				margin 0
				font-size 15px
				line-height 16px
				color isDark ? #606984 : #ccc

		> .mk-follow-button
			position absolute
			top 16px
			right 16px

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

		> [data-fa]
			margin-right 4px

.mkw-users--body[data-darkmode]
	root(true)

.mkw-users--body:not([data-darkmode])
	root(false)

</style>
