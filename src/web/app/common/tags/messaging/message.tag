<mk-messaging-message data-is-me={ message.is_me }>
	<a class="avatar-anchor" href={ '/' + message.user.username } title={ message.user.username } target="_blank">
		<img class="avatar" src={ message.user.avatar_url + '?thumbnail&size=80' } alt=""/>
	</a>
	<div class="content-container">
		<div class="balloon">
			<p class="read" if={ message.is_me && message.is_read }>%i18n:common.tags.mk-messaging-message.is-read%</p>
			<button class="delete-button" if={ message.is_me } title="%i18n:common.delete%"><img src="/assets/desktop/messaging/delete.png" alt="Delete"/></button>
			<div class="content" if={ !message.is_deleted }>
				<div ref="text"></div>
				<div class="image" if={ message.file }><img src={ message.file.url } alt="image" title={ message.file.name }/></div>
			</div>
			<div class="content" if={ message.is_deleted }>
				<p class="is-deleted">%i18n:common.tags.mk-messaging-message.deleted%</p>
			</div>
		</div>
		<footer>
			<mk-time time={ message.created_at }/><virtual if={ message.is_edited }>%fa:pencil-alt%</virtual>
		</footer>
	</div>
	<style>
		:scope
			$me-balloon-color = #23A7B6

			display block
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

						> [ref='text']
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

			&:not([data-is-me='true'])
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

			&[data-is-me='true']
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

							> [ref='text']
								&, *
									color #fff !important

					> footer
						text-align right

			&[data-is-deleted='true']
					> .content-container
						opacity 0.5

	</style>
	<script>
		import compile from '../../../common/scripts/text-compiler';

		this.mixin('i');

		this.message = this.opts.message;
		this.message.is_me = this.message.user.id == this.I.id;

		this.on('mount', () => {
			if (this.message.text) {
				const tokens = this.message.ast;

				this.$refs.text.innerHTML = compile(tokens);

				Array.from(this.$refs.text.children).forEach(e => {
					if (e.tagName == 'MK-URL') riot.mount(e);
				});

				// URLをプレビュー
				tokens
					.filter(t => t.type == 'link')
					.map(t => {
						const el = this.$refs.text.appendChild(document.createElement('mk-url-preview'));
						riot.mount(el, {
							url: t.content
						});
					});
			}
		});
	</script>
</mk-messaging-message>
