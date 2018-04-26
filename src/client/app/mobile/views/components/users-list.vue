<template>
<div class="mk-users-list">
	<nav>
		<span :data-active="mode == 'all'" @click="mode = 'all'">%i18n:@all%<span>{{ count }}</span></span>
		<span v-if="os.isSignedIn && youKnowCount" :data-active="mode == 'iknow'" @click="mode = 'iknow'">%i18n:@known%<span>{{ youKnowCount }}</span></span>
	</nav>
	<div class="users" v-if="!fetching && users.length != 0">
		<mk-user-preview v-for="u in users" :user="u" :key="u.id"/>
	</div>
	<button class="more" v-if="!fetching && next != null" @click="more" :disabled="moreFetching">
		<span v-if="!moreFetching">%i18n:@load-more%</span>
		<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span>
	</button>
	<p class="no" v-if="!fetching && users.length == 0">
		<slot></slot>
	</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['fetch', 'count', 'youKnowCount'],
	data() {
		return {
			limit: 30,
			mode: 'all',
			fetching: true,
			moreFetching: false,
			users: [],
			next: null
		};
	},
	watch: {
		mode() {
			this._fetch();
		}
	},
	mounted() {
		this._fetch(() => {
			this.$emit('loaded');
		});
	},
	methods: {
		_fetch(cb?) {
			this.fetching = true;
			this.fetch(this.mode == 'iknow', this.limit, null, obj => {
				this.users = obj.users;
				this.next = obj.next;
				this.fetching = false;
				if (cb) cb();
			});
		},
		more() {
			this.moreFetching = true;
			this.fetch(this.mode == 'iknow', this.limit, this.next, obj => {
				this.moreFetching = false;
				this.users = this.users.concat(obj.users);
				this.next = obj.next;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-users-list

	> nav
		display flex
		justify-content center
		margin 0 auto
		max-width 600px
		border-bottom solid 1px rgba(0, 0, 0, 0.2)

		> span
			display block
			flex 1 1
			text-align center
			line-height 52px
			font-size 14px
			color #657786
			border-bottom solid 2px transparent

			&[data-active]
				font-weight bold
				color $theme-color
				border-color $theme-color

			> span
				display inline-block
				margin-left 4px
				padding 2px 5px
				font-size 12px
				line-height 1
				color #fff
				background rgba(0, 0, 0, 0.3)
				border-radius 20px

	> .users
		margin 8px auto
		max-width 500px
		width calc(100% - 16px)
		background #fff
		border-radius 8px
		box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

		@media (min-width 500px)
			margin 16px auto
			width calc(100% - 32px)

		> *
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

	> .no
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

</style>
