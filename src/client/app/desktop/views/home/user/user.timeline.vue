<template>
<div>
	<mk-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')">
		<template #header>
			<header class="kugajpep">
				<span :data-active="mode == 'default'" @click="mode = 'default'"><fa :icon="['far', 'comment-alt']"/> {{ $t('default') }}</span>
				<span :data-active="mode == 'with-replies'" @click="mode = 'with-replies'"><fa icon="comments"/> {{ $t('with-replies') }}</span>
				<span :data-active="mode == 'with-media'" @click="mode = 'with-media'"><fa :icon="['far', 'images']"/> {{ $t('with-media') }}</span>
				<span :data-active="mode == 'my-posts'" @click="mode = 'my-posts'"><fa icon="user"/> {{ $t('my-posts') }}</span>
			</header>
		</template>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.timeline.vue'),

	props: ['user'],

	data() {
		return {
			fetching: true,
			mode: 'default',
			unreadCount: 0,
			date: null,
			pagination: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.user.id,
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
					includeReplies: this.mode == 'with-replies',
					includeMyRenotes: this.mode != 'my-posts',
					withFiles: this.mode == 'with-media',
				})
			}
		};
	},

	watch: {
		mode() {
			(this.$refs.timeline as unknown).reload();
		}
	},

	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		this.$root.$on('warp', this.warp);
		this.$once('hook:beforeDestroy', () => {
			this.$root.$off('warp', this.warp);
			document.removeEventListener('keydown', this.onDocumentKeydown);
		});
	},

	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
				if (e.which == 84) { // [t]
					(this.$refs.timeline as unknown).focus();
				}
			}
		},

		warp(date) {
			this.date = date;
			(this.$refs.timeline as unknown).reload();
		}
	}
});
</script>

<style lang="stylus" scoped>
.kugajpep
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
