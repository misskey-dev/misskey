<mk-reaction-picker>
	<div class="backdrop" ref="backdrop" onclick={ close }></div>
	<div class="popover" ref="popover">
		<button onclick={ react.bind(null, 'like') } tabindex="1" title="いいね"><mk-reaction-icon reaction='like'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'love') } tabindex="2" title="ハート"><mk-reaction-icon reaction='love'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'laugh') } tabindex="3" title="笑"><mk-reaction-icon reaction='laugh'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'hmm') } tabindex="4" title="ふぅ～む"><mk-reaction-icon reaction='hmm'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'surprise') } tabindex="5" title="驚き"><mk-reaction-icon reaction='surprise'></mk-reaction-icon></button>
		<button onclick={ react.bind(null, 'congrats') } tabindex="6" title="おめでとう"><mk-reaction-icon reaction='congrats'></mk-reaction-icon></button>
	</div>
	<style>
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

			> .popover
				position absolute
				z-index 10001
				padding 4px
				background #fff
				border 1px solid rgba(27, 31, 35, 0.15)
				border-radius 4px
				box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
				transform scale(0.5)
				opacity 0

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

		this.on('mount', () => {
			const rect = this.source.getBoundingClientRect();
			const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);

			const width = this.refs.popover.offsetWidth;
			const height = this.refs.popover.offsetHeight;
			this.refs.popover.style.left = (x - (width / 2)) + 'px';
			this.refs.popover.style.top = (y - (height / 2)) + 'px';

			anime({
				targets: this.refs.popover,
				opacity: [0, 1],
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
				complete: this.unmount
			});
		};
	</script>
</mk-reaction-picker>
