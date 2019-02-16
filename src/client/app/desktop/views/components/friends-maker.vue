<template>
<div class="mk-friends-maker">
	<p class="title">{{ $t('title') }}</p>
	<div class="users" v-if="!fetching && users.length > 0">
		<div class="user" v-for="user in users" :key="user.id">
			<mk-avatar class="avatar" :user="user" target="_blank"/>
			<div class="body">
				<router-link class="name" :to="user | userPage" v-user-preview="user.id">
					<mk-user-name :user="user"/>
				</router-link>
				<p class="username">@{{ user | acct }}</p>
			</div>
		</div>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">{{ $t('empty') }}</p>
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('fetching') }}<mk-ellipsis/></p>
	<a class="refresh" @click="refresh">{{ $t('refresh') }}</a>
	<button class="close" @click="destroyDom()" :title="$t('title')"><fa icon="times"/></button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/friends-maker.vue'),
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
		fetch() {
			this.fetching = true;
			this.users = [];

			this.$root.api('users/recommendation', {
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
		color var(--text)

	> .fetching
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> [data-icon]
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

		> [data-icon]
			box-sizing initial
			padding 14px

</style>
