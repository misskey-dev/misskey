<template>
<div class="mk-mentions">
	<header>
		<span :data-active="mode == 'all'" @click="mode = 'all'">すべて</span>
		<span :data-active="mode == 'following'" @click="mode = 'following'">フォロー中</span>
	</header>
	<div class="fetching" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="notes.length == 0 && !fetching">
		%fa:R comments%
		<span v-if="mode == 'all'">あなた宛ての投稿はありません。</span>
		<span v-if="mode == 'following'">あなたがフォローしているユーザーからの言及はありません。</span>
	</p>
	<mk-notes :notes="notes" ref="timeline"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			moreFetching: false,
			mode: 'all',
			notes: []
		};
	},
	watch: {
		mode() {
			this.fetch();
		}
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll);

		this.fetch(() => this.$emit('loaded'));
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},
	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					(this.$refs.timeline as any).focus();
				}
			}
		},
		onScroll() {
			const current = window.scrollY + window.innerHeight;
			if (current > document.body.offsetHeight - 8) this.more();
		},
		fetch(cb?) {
			this.fetching = true;
			this.notes =  [];
			(this as any).api('notes/mentions', {
				following: this.mode == 'following'
			}).then(notes => {
				this.notes = notes;
				this.fetching = false;
				if (cb) cb();
			});
		},
		more() {
			if (this.moreFetching || this.fetching || this.notes.length == 0) return;
			this.moreFetching = true;
			(this as any).api('notes/mentions', {
				following: this.mode == 'following',
				untilId: this.notes[this.notes.length - 1].id
			}).then(notes => {
				this.notes = this.notes.concat(notes);
				this.moreFetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-mentions
	background #fff
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

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

	> .fetching
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
