<mk-contextmenu>
	<yield />
	<style lang="stylus" scoped>
		:scope
			$width = 240px
			$item-height = 38px
			$padding = 10px

			display none
			position fixed
			top 0
			left 0
			z-index 4096
			width $width
			font-size 0.8em
			background #fff
			border-radius 0 4px 4px 4px
			box-shadow 2px 2px 8px rgba(0, 0, 0, 0.2)
			opacity 0

			ul
				display block
				margin 0
				padding $padding 0
				list-style none

			li
				display block

				&.separator
					margin-top $padding
					padding-top $padding
					border-top solid 1px #eee

				&.has-child
					> p
						cursor default

						> [data-fa]:last-child
							position absolute
							top 0
							right 8px
							line-height $item-height

					&:hover > ul
						visibility visible

					&:active
						> p, a
							background $theme-color

				> p, a
					display block
					z-index 1
					margin 0
					padding 0 32px 0 38px
					line-height $item-height
					color #868C8C
					text-decoration none
					cursor pointer

					&:hover
						text-decoration none

					*
						pointer-events none

					> i
						width 28px
						margin-left -28px
						text-align center

				&:hover
					> p, a
						text-decoration none
						background $theme-color
						color $theme-color-foreground

				&:active
					> p, a
						text-decoration none
						background darken($theme-color, 10%)
						color $theme-color-foreground

			li > ul
				visibility hidden
				position absolute
				top 0
				left $width
				margin-top -($padding)
				width $width
				background #fff
				border-radius 0 4px 4px 4px
				box-shadow 2px 2px 8px rgba(0, 0, 0, 0.2)
				transition visibility 0s linear 0.2s

	</style>
	<script lang="typescript">
		import anime from 'animejs';
		import contains from '../../common/scripts/contains';

		this.root.addEventListener('contextmenu', e => {
			e.preventDefault();
		});

		this.mousedown = e => {
			e.preventDefault();
			if (!contains(this.root, e.target) && (this.root != e.target)) this.close();
			return false;
		};

		this.open = pos => {
			document.querySelectorAll('body *').forEach(el => {
				el.addEventListener('mousedown', this.mousedown);
			});

			this.root.style.display = 'block';
			this.root.style.left = pos.x + 'px';
			this.root.style.top = pos.y + 'px';

			anime({
				targets: this.root,
				opacity: [0, 1],
				duration: 100,
				easing: 'linear'
			});
		};

		this.close = () => {
			document.querySelectorAll('body *').forEach(el => {
				el.removeEventListener('mousedown', this.mousedown);
			});

			this.$emit('closed');
			this.$destroy();
		};
	</script>
</mk-contextmenu>
