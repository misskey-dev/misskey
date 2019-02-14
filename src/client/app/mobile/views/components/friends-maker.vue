<template>
<div class="mk-friends-maker">
	<p class="title">{{ $t('title') }}:</p>
	<div class="users" v-if="!fetching && users.length > 0">
		<mk-user-card v-for="user in users" :key="user.id" :user="user"/>
	</div>
	<p class="empty" v-if="!fetching && users.length == 0">{{ $t('empty') }}</p>
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('fetching') }}<mk-ellipsis/></p>
	<a class="refresh" @click="refresh">{{ $t('refresh') }}</a>
	<button class="close" @click="close" :title="$t('title')"><fa icon="times"/></button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n('mobile/views/components/friends-maker.vue'),
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
		},
		close() {
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-friends-maker
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(#000, 0.2)

	> .title
		margin 0
		padding 8px 16px
		font-size 1em
		font-weight bold
		color #888

	> .users
		overflow-x scroll
		-webkit-overflow-scrolling touch
		white-space nowrap
		padding 16px
		background #eee

		> .mk-user-card
			&:not(:last-child)
				margin-right 16px

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
		margin 0
		padding 8px 16px
		text-align right
		font-size 0.9em
		color #999

	> .close
		cursor pointer
		display block
		position absolute
		top 0
		right 0
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
			padding 10px

</style>
