<template>
<div class="timeline">
	<header>
		<span :data-active="mode == 'default'" @click="mode = 'default'">%i18n:@default%</span>
		<span :data-active="mode == 'with-replies'" @click="mode = 'with-replies'">%i18n:@with-replies%</span>
		<span :data-active="mode == 'with-media'" @click="mode = 'with-media'">%i18n:@with-media%</span>
	</header>
	<div class="loading" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<mk-notes ref="timeline" :more="existMore ? more : null">
		<p class="empty" slot="empty">%fa:R comments%%i18n:@empty%</p>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;

export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			mode: 'default',
			unreadCount: 0,
			date: null
		};
	},
	watch: {
		mode() {
			this.fetch();
		}
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);

		this.fetch(() => this.$emit('loaded'));
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
	},
	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
				if (e.which == 84) { // [t]
					(this.$refs.timeline as any).focus();
				}
			}
		},
		fetch(cb?) {
			this.fetching = true;
			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api('users/notes', {
					userId: this.user.id,
					limit: fetchLimit + 1,
					untilDate: this.date ? this.date.getTime() : undefined,
					includeReplies: this.mode == 'with-replies',
					withMedia: this.mode == 'with-media'
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					if (cb) cb();
				}, rej);
			}));
		},
		more() {
			this.moreFetching = true;
			(this as any).api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				includeReplies: this.mode == 'with-replies',
				withMedia: this.mode == 'with-media',
				untilId: (this.$refs.timeline as any).tail().id
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});
		},
		warp(date) {
			this.date = date;
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.timeline
	background #fff

	> header
		padding 8px 16px
		border-bottom solid 1px #eee

		> span
			margin-right 16px
			line-height 27px
			font-size 18px
			color #555

			&:not([data-active])
				color $theme-color
				cursor pointer

				&:hover
					text-decoration underline

	> .loading
		padding 64px 0

	> .empty
		display block
		margin 0 auto
		padding 32px
		max-width 400px
		text-align center
		color #999

		> [data-fa]
			display block
			margin-bottom 16px
			font-size 3em
			color #ccc

</style>
