<template>
<div class="message" :data-is-me="isMe">
	<router-link class="avatar-anchor" :to="`/@${acct}`" :title="acct" target="_blank">
		<img class="avatar" :src="`${message.user.avatar_url}?thumbnail&size=80`" alt=""/>
	</router-link>
	<div class="content">
		<div class="balloon" :data-no-text="message.text == null">
			<p class="read" v-if="isMe && message.isRead">%i18n:common.tags.mk-messaging-message.is-read%</p>
			<button class="delete-button" v-if="isMe" title="%i18n:common.delete%">
				<img src="/assets/desktop/messaging/delete.png" alt="Delete"/>
			</button>
			<div class="content" v-if="!message.is_deleted">
				<mk-post-html class="text" v-if="message.ast" :ast="message.ast" :i="os.i"/>
				<div class="file" v-if="message.file">
					<a :href="message.file.url" target="_blank" :title="message.file.name">
						<img v-if="message.file.type.split('/')[0] == 'image'" :src="message.file.url" :alt="message.file.name"/>
						<p v-else>{{ message.file.name }}</p>
					</a>
				</div>
			</div>
			<div class="content" v-if="message.is_deleted">
				<p class="is-deleted">%i18n:common.tags.mk-messaging-message.deleted%</p>
			</div>
		</div>
		<div></div>
		<mk-url-preview v-for="url in urls" :url="url" :key="url"/>
		<footer>
			<mk-time :time="message.createdAt"/>
			<template v-if="message.is_edited">%fa:pencil-alt%</template>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../common/user/get-acct';

export default Vue.extend({
	props: ['message'],
	computed: {
		acct() {
			return getAcct(this.message.user);
		},
		isMe(): boolean {
			return this.message.userId == (this as any).os.i.id;
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

	> .avatar-anchor
		display block
		position absolute
		top 10px

		> .avatar
			display block
			min-width 54px
			min-height 54px
			max-width 54px
			max-height 54px
			margin 0
			border-radius 8px
			transition all 0.1s ease

	> .content

		> .balloon
			display block
			padding 0
			max-width calc(100% - 16px)
			min-height 38px
			border-radius 16px

			&:before
				content ""
				pointer-events none
				display block
				position absolute
				top 12px

			& + *
				clear both

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

					& + .file
						> a
							border-radius 0 0 16px 16px

				> .file
					> a
						display block
						max-width 100%
						max-height 512px
						border-radius 16px
						overflow hidden
						text-decoration none

						&:hover
							text-decoration none

							> p
								background #ccc

						> *
							display block
							margin 0
							width 100%
							height 100%

						> p
							padding 30px
							text-align center
							color #555
							background #ddd

		> .mk-url-preview
			margin 8px 0

		> footer
			display block
			margin 2px 0 0 0
			font-size 10px
			color rgba(0, 0, 0, 0.4)

			> [data-fa]
				margin-left 4px

	&:not([data-is-me])
		> .avatar-anchor
			left 12px

		> .content
			padding-left 66px

			> .balloon
				float left
				background #eee

				&[data-no-text]
					background transparent

				&:not([data-no-text]):before
					left -14px
					border-top solid 8px transparent
					border-right solid 8px #eee
					border-bottom solid 8px transparent
					border-left solid 8px transparent

			> footer
				text-align left

	&[data-is-me]
		> .avatar-anchor
			right 12px

		> .content
			padding-right 66px

			> .balloon
				float right
				background $me-balloon-color

				&[data-no-text]
					background transparent

				&:not([data-no-text]):before
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
		> .baloon
			opacity 0.5

</style>
