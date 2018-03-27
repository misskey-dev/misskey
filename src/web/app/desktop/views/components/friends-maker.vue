<template>
<div class="mk-friends-maker">
	<p class="title">気になるユーザーをフォロー:</p>
	<div class="users" v-if="!fetching && users.length > 0">
		<div class="user" v-for="user in users" :key="user.id">
			<router-link class="avatar-anchor" :to="`/@${getAcct(user)}`">
				<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=42`" alt="" v-user-preview="user.id"/>
			</router-link>
			<div class="body">
				<router-link class="name" :to="`/@${getAcct(user)}`" v-user-preview="user.id">{{ user.name }}</router-link>
				<p class="username">@{{ getAcct(user) }}</p>
			</div>
			<mk-follow-button :user="user"/>
		</div>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">おすすめのユーザーは見つかりませんでした。</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%読み込んでいます<mk-ellipsis/></p>
	<a class="refresh" @click="refresh">もっと見る</a>
	<button class="close" @click="$destroy()" title="閉じる">%fa:times%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../common/user/get-acct';

export default Vue.extend({
	data() {
		return {
			users: [],
			fetching: true,
			limit: 6,
			page: 0
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		getAcct,
		fetch() {
			this.fetching = true;
			this.users = [];

			(this as any).api('users/recommendation', {
				limit: this.limit,
				offset: this.limit * this.page
			}).then(users => {
				this.users = users;
				this.fetching = false;
			});
		},
		refresh() {
			if (this.users.length < this.limit) {
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
.mk-friends-maker
	padding 24px

	> .title
		margin 0 0 12px 0
		font-size 1em
		font-weight bold
		color #888

	> .users
		&:after
			content ""
			display block
			clear both

		> .user
			padding 16px
			width 238px
			float left

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
					margin 0
					font-size 15px
					line-height 16px
					color #ccc

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

	> .refresh
		display block
		margin 0 8px 0 0
		text-align right
		font-size 0.9em
		color #999

	> .close
		cursor pointer
		display block
		position absolute
		top 6px
		right 6px
		z-index 1
		margin 0
		padding 0
		font-size 1.2em
		color #999
		border none
		outline none
		background transparent

		&:hover
			color #555

		&:active
			color #222

		> [data-fa]
			padding 14px

</style>
