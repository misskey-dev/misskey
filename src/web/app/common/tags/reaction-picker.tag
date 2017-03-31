<mk-reaction-picker>
	<div class="backdrop" ref="backdrop" onclick={ close }></div>
	<div class="popover { compact: opts.compact }" ref="popover">
		<p if={ !opts.compact }>{ title }</p>
		<div>
			<button onclick={ react.bind(null, 'like') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="1" title="%i18n:common.reactions.like%"><mk-reaction-icon reaction='like'></mk-reaction-icon></button>
			<button onclick={ react.bind(null, 'love') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="2" title="%i18n:common.reactions.love%"><mk-reaction-icon reaction='love'></mk-reaction-icon></button>
			<button onclick={ react.bind(null, 'laugh') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="3" title="%i18n:common.reactions.laugh%"><mk-reaction-icon reaction='laugh'></mk-reaction-icon></button>
			<button onclick={ react.bind(null, 'hmm') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="4" title="%i18n:common.reactions.hmm%"><mk-reaction-icon reaction='hmm'></mk-reaction-icon></button>
			<button onclick={ react.bind(null, 'surprise') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="5" title="%i18n:common.reactions.surprise%"><mk-reaction-icon reaction='surprise'></mk-reaction-icon></button>
			<button onclick={ react.bind(null, 'congrats') } onmouseover={ onmouseover } onmouseout={ onmouseout } tabindex="6" title="%i18n:common.reactions.congrats%"><mk-reaction-icon reaction='congrats'></mk-reaction-icon></button>
		</div>
	</div>
	<style>
		$border-color = rgba(27, 31, 35, 0.15)

		:scope
			display block
			position initial

			> .backdrop
				position fixed
				top 0
				left 0
				z-index 10000
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.1)
				opacity 0

			> .popover
				position absolute
				z-index 10001
				background #fff
				border 1px solid $border-color
				border-radius 4px
				box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
				transform scale(0.5)
				opacity 0

				$balloon-size = 16px

				&:not(.compact)
					margin-top $balloon-size
					transform-origin center -($balloon-size)

					&:before
						content ""
						display block
						position absolute
						top -($balloon-size * 2)
						left s('calc(50% - %s)', $balloon-size)
						border-top solid $balloon-size transparent
						border-left solid $balloon-size transparent
						border-right solid $balloon-size transparent
						border-bottom solid $balloon-size $border-color

					&:after
						content ""
						display block
						position absolute
						top -($balloon-size * 2) + 1.5px
						left s('calc(50% - %s)', $balloon-size)
						border-top solid $balloon-size transparent
						border-left solid $balloon-size transparent
						border-right solid $balloon-size transparent
						border-bottom solid $balloon-size #fff

				> p
					display block
					margin 0
					padding 8px 10px
					font-size 14px
					color #586069
					border-bottom solid 1px #e1e4e8

				> div
					padding 4px

					> button
						width 40px
						height 40px
						font-size 24px
						border-radius 2px

						&:hover
							background #eee

						&:active
							background $theme-color
							box-shadow inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15)

	</style>
	<script>
		import anime from 'animejs';

		this.mixin('api');

		this.post = this.opts.post;
		this.source = this.opts.source;

		const placeholder = '%i18n:common.tags.mk-reaction-picker.choose-reaction%';

		this.title = placeholder;

		this.onmouseover = e => {
			this.update({
				title: e.target.title
			});
		};

		this.onmouseout = () => {
			this.update({
				title: placeholder
			});
		};

		this.on('mount', () => {
			const rect = this.source.getBoundingClientRect();
			const width = this.refs.popover.offsetWidth;
			const height = this.refs.popover.offsetHeight;
			if (this.opts.compact) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				this.refs.popover.style.left = (x - (width / 2)) + 'px';
				this.refs.popover.style.top = (y - (height / 2)) + 'px';
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				this.refs.popover.style.left = (x - (width / 2)) + 'px';
				this.refs.popover.style.top = y + 'px';
			}

			anime({
				targets: this.refs.backdrop,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: 500
			});
		});

		this.react = reaction => {
			this.api('posts/reactions/create', {
				post_id: this.post.id,
				reaction: reaction
			}).then(() => {
				if (this.opts.cb) this.opts.cb();
				this.unmount();
			});
		};

		this.close = () => {
			this.refs.backdrop.style.pointerEvents = 'none';
			anime({
				targets: this.refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			this.refs.popover.style.pointerEvents = 'none';
			anime({
				targets: this.refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.unmount()
			});
		};
	</script>
</mk-reaction-picker>
