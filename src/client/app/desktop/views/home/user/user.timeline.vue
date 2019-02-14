<template>
<div class="oh5y2r7l5lx8j6jj791ykeiwgihheguk">
	<header>
		<span :data-active="mode == 'default'" @click="mode = 'default'"><fa :icon="['far', 'comment-alt']"/> {{ $t('default') }}</span>
		<span :data-active="mode == 'with-replies'" @click="mode = 'with-replies'"><fa icon="comments"/> {{ $t('with-replies') }}</span>
		<span :data-active="mode == 'with-media'" @click="mode = 'with-media'"><fa :icon="['far', 'images']"/> {{ $t('with-media') }}</span>
		<span :data-active="mode == 'my-posts'" @click="mode = 'my-posts'"><fa icon="user"/> {{ $t('my-posts') }}</span>
	</header>
	<mk-notes ref="timeline" :more="existMore ? more : null">
		<p class="empty" slot="empty"><fa :icon="['far', 'comments']"/>{{ $t('empty') }}</p>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.timeline.vue'),
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
				this.$root.api('users/notes', {
					userId: this.user.id,
					limit: fetchLimit + 1,
					untilDate: this.date ? this.date.getTime() : new Date().getTime() + 1000 * 86400 * 365,
					includeReplies: this.mode == 'with-replies',
					includeMyRenotes: this.mode != 'my-posts',
					withFiles: this.mode == 'with-media'
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

			const promise = this.$root.api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				includeReplies: this.mode == 'with-replies',
				includeMyRenotes: this.mode != 'my-posts',
				withFiles: this.mode == 'with-media',
				untilDate: new Date((this.$refs.timeline as any).tail().createdAt).getTime()
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) {
					(this.$refs.timeline as any).append(n);
				}
				this.moreFetching = false;
			});

			return promise;
		},

		warp(date) {
			this.date = date;
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
.oh5y2r7l5lx8j6jj791ykeiwgihheguk
	background var(--face)
	border-radius var(--round)
	overflow hidden

	> header
		padding 0 8px
		z-index 10
		background var(--faceHeader)
		box-shadow 0 1px var(--desktopTimelineHeaderShadow)

		> span
			display inline-block
			padding 0 10px
			line-height 42px
			font-size 12px
			user-select none

			&[data-active]
				color var(--primary)
				cursor default
				font-weight bold

				&:before
					content ""
					display block
					position absolute
					bottom 0
					left -8px
					width calc(100% + 16px)
					height 2px
					background var(--primary)

			&:not([data-active])
				color var(--desktopTimelineSrc)
				cursor pointer

				&:hover
					color var(--desktopTimelineSrcHover)

	> .mk-notes

		> .empty
			display block
			margin 0 auto
			padding 32px
			max-width 400px
			text-align center
			color var(--text)

			> [data-icon]
				display block
				margin-bottom 16px
				font-size 3em
				color var(--faceHeaderText);

</style>
