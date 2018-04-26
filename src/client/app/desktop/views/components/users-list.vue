<template>
<div class="mk-users-list">
	<nav>
		<div>
			<span :data-active="mode == 'all'" @click="mode = 'all'">すべて<span>{{ count }}</span></span>
			<span v-if="os.isSignedIn && youKnowCount" :data-active="mode == 'iknow'" @click="mode = 'iknow'">知り合い<span>{{ youKnowCount }}</span></span>
		</div>
	</nav>
	<div class="users" v-if="!fetching && users.length != 0">
		<div v-for="u in users" :key="u.id">
			<x-item :user="u"/>
		</div>
	</div>
	<button class="more" v-if="!fetching && next != null" @click="more" :disabled="moreFetching">
		<span v-if="!moreFetching">もっと</span>
		<span v-if="moreFetching">読み込み中<mk-ellipsis/></span>
	</button>
	<p class="no" v-if="!fetching && users.length == 0">
		<slot></slot>
	</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%読み込んでいます<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XItem from './users-list.item.vue';

export default Vue.extend({
	components: {
		XItem
	},
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
	mounted() {
		this._fetch(() => {
			this.$emit('loaded');
		});
	},
	methods: {
		_fetch(cb) {
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
	height 100%
	background #fff

	> nav
		z-index 1
		box-shadow 0 1px 0 rgba(#000, 0.1)

		> div
			display flex
			justify-content center
			margin 0 auto
			max-width 600px

			> span
				display block
				flex 1 1
				text-align center
				line-height 52px
				font-size 14px
				color #657786
				border-bottom solid 2px transparent
				cursor pointer

				*
					pointer-events none

				&[data-active]
					font-weight bold
					color $theme-color
					border-color $theme-color
					cursor default

				> span
					display inline-block
					margin-left 4px
					padding 2px 5px
					font-size 12px
					line-height 1
					color #888
					background #eee
					border-radius 20px

	> .users
		height calc(100% - 54px)
		overflow auto

		> *
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			> *
				max-width 600px
				margin 0 auto

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
