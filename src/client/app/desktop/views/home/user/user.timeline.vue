<template>
<div>
	<mk-notes ref="timeline" :make-promise="makePromise" @inited="() => $emit('loaded')">
		<template #header>
			<header class="oh5y2r7l5lx8j6jj791ykeiwgihheguk">
				<span :data-active="mode == 'default'" @click="mode = 'default'"><fa :icon="['far', 'comment-alt']"/> {{ $t('default') }}</span>
				<span :data-active="mode == 'with-replies'" @click="mode = 'with-replies'"><fa icon="comments"/> {{ $t('with-replies') }}</span>
				<span :data-active="mode == 'with-media'" @click="mode = 'with-media'"><fa :icon="['far', 'images']"/> {{ $t('with-media') }}</span>
				<span :data-active="mode == 'my-posts'" @click="mode = 'my-posts'"><fa icon="user"/> {{ $t('my-posts') }}</span>
			</header>
		</template>
		<template #empty><fa :icon="['far', 'comments']"/>{{ $t('empty') }}</template>
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
			mode: 'default',
			unreadCount: 0,
			date: null,
			makePromise: cursor => this.$root.api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				includeReplies: this.mode == 'with-replies',
				includeMyRenotes: this.mode != 'my-posts',
				withFiles: this.mode == 'with-media',
				untilId: cursor ? cursor : undefined
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: notes[notes.length - 1].id
					};
				} else {
					return {
						notes: notes,
						cursor: null
					};
				}
			})
		};
	},

	watch: {
		mode() {
			(this.$refs.timeline as any).reload();
		}
	},

	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
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

		warp(date) {
			this.date = date;
			(this.$refs.timeline as any).reload();
		}
	}
});
</script>

<style lang="stylus" scoped>
.oh5y2r7l5lx8j6jj791ykeiwgihheguk
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

</style>
