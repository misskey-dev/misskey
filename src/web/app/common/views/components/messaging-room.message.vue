<template>
<div class="message" :data-is-me="isMe">
	<a class="avatar-anchor" :href="`/${message.user.username}`" :title="message.user.username" target="_blank">
		<img class="avatar" :src="`${message.user.avatar_url}?thumbnail&size=80`" alt=""/>
	</a>
	<div class="content-container">
		<div class="balloon">
			<p class="read" v-if="isMe && message.is_read">%i18n:common.tags.mk-messaging-message.is-read%</p>
			<button class="delete-button" v-if="isMe" title="%i18n:common.delete%">
				<img src="/assets/desktop/messaging/delete.png" alt="Delete"/>
			</button>
			<div class="content" v-if="!message.is_deleted">
				<mk-post-html class="text" v-if="message.ast" :ast="message.ast" :i="os.i"/>
				<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
				<div class="image" v-if="message.file">
					<img :src="message.file.url" alt="image" :title="message.file.name"/>
				</div>
			</div>
			<div class="content" v-if="message.is_deleted">
				<p class="is-deleted">%i18n:common.tags.mk-messaging-message.deleted%</p>
			</div>
		</div>
		<footer>
			<mk-time :time="message.created_at"/>
			<template v-if="message.is_edited">%fa:pencil-alt%</template>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['message'],
	computed: {
		isMe(): boolean {
			return this.message.user_id == (this as any).os.i.id;
		},
		urls(): string[] {
			if (this.message.ast) {
				return this.message.ast
					.filter(t => (t.type == 'url' || t.type == 'link') && !t.silent)
					.map(t => t.url);
			} else {
				return null;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.message
	$me-balloon-color = #23A7B6

	padding 10px 12px 10px 12px
	background-color transparent

	&:after
		content ""
		display block
		clear both

	> .avatar-anchor
		display block

		> .avatar
			display block
			min-width 54px
			min-height 54px
			max-width 54px
			max-height 54px
			margin 0
			border-radius 8px
			transition all 0.1s ease

	> .content-container
		display block
		margin 0 12px
		padding 0
		max-width calc(100% - 78px)

		> .balloon
			display block
			float inherit
			margin 0
			padding 0
			max-width 100%
			min-height 38px
			border-radius 16px

			&:before
				content ""
				pointer-events none
				display block
				position absolute
				top 12px

			&:hover
				> .delete-button
					display block

			> .delete-button
				display none
				position absolute
				z-index 1
				top -4px
				right -4px
				margin 0
				padding 0
				cursor pointer
				outline none
				border none
				border-radius 0
				box-shadow none
				background transparent

				> img
					vertical-align bottom
					width 16px
					height 16px
					cursor pointer

			> .read
				user-select none
				display block
				position absolute
				z-index 1
				bottom -4px
				left -12px
				margin 0
				color rgba(0, 0, 0, 0.5)
				font-size 11px

			> .content

				> .is-deleted
					display block
					margin 0
					padding 0
					overflow hidden
					overflow-wrap break-word
					font-size 1em
					color rgba(0, 0, 0, 0.5)

				> .text
					display block
					margin 0
					padding 8px 16px
					overflow hidden
					overflow-wrap break-word
					font-size 1em
					color rgba(0, 0, 0, 0.8)

					&, *
						user-select text
						cursor auto

					& + .file
						&.image
							> img
								border-radius 0 0 16px 16px

				> .file
					&.image
						> img
							display block
							max-width 100%
							max-height 512px
							border-radius 16px

		> footer
			display block
			clear both
			margin 0
			padding 2px
			font-size 10px
			color rgba(0, 0, 0, 0.4)

			> [data-fa]
				margin-left 4px

	&:not([data-is-me])
		> .avatar-anchor
			float left

		> .content-container
			float left

			> .balloon
				background #eee

				&:before
					left -14px
					border-top solid 8px transparent
					border-right solid 8px #eee
					border-bottom solid 8px transparent
					border-left solid 8px transparent

			> footer
				text-align left

	&[data-is-me]
		> .avatar-anchor
			float right

		> .content-container
			float right

			> .balloon
				background $me-balloon-color

				&:before
					right -14px
					left auto
					border-top solid 8px transparent
					border-right solid 8px transparent
					border-bottom solid 8px transparent
					border-left solid 8px $me-balloon-color

				> .content

					> p.is-deleted
						color rgba(255, 255, 255, 0.5)

					> .text >>>
						&, *
							color #fff !important

			> footer
				text-align right

	&[data-is-deleted]
			> .content-container
				opacity 0.5

</style>
