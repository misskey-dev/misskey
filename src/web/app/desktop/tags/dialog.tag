<mk-dialog>
	<div class="bg" ref="bg" @click="bgClick"></div>
	<div class="main" ref="main">
		<header ref="header"></header>
		<div class="body" ref="body"></div>
		<div class="buttons">
			<virtual each={ opts.buttons }>
				<button @click="_onclick">{ text }</button>
			</virtual>
		</div>
	</div>
	<style>
		:scope
			display block

			> .bg
				display block
				position fixed
				z-index 8192
				top 0
				left 0
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.7)
				opacity 0
				pointer-events none

			> .main
				display block
				position fixed
				z-index 8192
				top 20%
				left 0
				right 0
				margin 0 auto 0 auto
				padding 32px 42px
				width 480px
				background #fff
				opacity 0

				> header
					margin 1em 0
					color $theme-color
					// color #43A4EC
					font-weight bold

					&:empty
						display none

					> i
						margin-right 0.5em

				> .body
					margin 1em 0
					color #888

				> .buttons
					> button
						display inline-block
						float right
						margin 0
						padding 10px 10px
						font-size 1.1em
						font-weight normal
						text-decoration none
						color #888
						background transparent
						outline none
						border none
						border-radius 0
						cursor pointer
						transition color 0.1s ease

						i
							margin 0 0.375em

						&:hover
							color $theme-color

						&:active
							color darken($theme-color, 10%)
							transition color 0s ease

	</style>
	<script>
		import anime from 'animejs';

		this.canThrough = opts.canThrough != null ? opts.canThrough : true;
		this.opts.buttons.forEach(button => {
			button._onclick = () => {
				if (button.onclick) button.onclick();
				this.close();
			};
		});

		this.on('mount', () => {
			this.$refs.header.innerHTML = this.opts.title;
			this.$refs.body.innerHTML = this.opts.text;

			this.$refs.bg.style.pointerEvents = 'auto';
			anime({
				targets: this.$refs.bg,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.main,
				opacity: 1,
				scale: [1.2, 1],
				duration: 300,
				easing: [ 0, 0.5, 0.5, 1 ]
			});
		});

		this.close = () => {
			this.$refs.bg.style.pointerEvents = 'none';
			anime({
				targets: this.$refs.bg,
				opacity: 0,
				duration: 300,
				easing: 'linear'
			});

			this.$refs.main.style.pointerEvents = 'none';
			anime({
				targets: this.$refs.main,
				opacity: 0,
				scale: 0.8,
				duration: 300,
				easing: [ 0.5, -0.5, 1, 0.5 ],
				complete: () => this.$destroy()
			});
		};

		this.bgClick = () => {
			if (this.canThrough) {
				if (this.opts.onThrough) this.opts.onThrough();
				this.close();
			}
		};
	</script>
</mk-dialog>
