<mk-post-form-home-widget>
	<mk-post-form if={ place == 'main' }/>
	<virtual if={ place != 'main' }>
		<virtual if={ data.design == 0 }>
			<p class="title">%fa:pencil-alt%%i18n:desktop.tags.mk-post-form-home-widget.title%</p>
		</virtual>
		<textarea disabled={ posting } ref="text" onkeydown={ onkeydown } placeholder="%i18n:desktop.tags.mk-post-form-home-widget.placeholder%"></textarea>
		<button @click="post" disabled={ posting }>%i18n:desktop.tags.mk-post-form-home-widget.post%</button>
	</virtual>
	<style>
		:scope
			display block
			background #fff
			overflow hidden
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> [data-fa]
					margin-right 4px

			> textarea
				display block
				width 100%
				max-width 100%
				min-width 100%
				padding 16px
				margin-bottom 28px + 16px
				border none
				border-bottom solid 1px #eee

			> button
				display block
				position absolute
				bottom 8px
				right 8px
				margin 0
				padding 0 10px
				height 28px
				color $theme-color-foreground
				background $theme-color !important
				outline none
				border none
				border-radius 4px
				transition background 0.1s ease
				cursor pointer

				&:hover
					background lighten($theme-color, 10%) !important

				&:active
					background darken($theme-color, 10%) !important
					transition background 0s ease

	</style>
	<script>
		this.data = {
			design: 0
		};

		this.mixin('widget');

		this.func = () => {
			if (++this.data.design == 2) this.data.design = 0;
			this.save();
		};

		this.onkeydown = e => {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
		};

		this.post = () => {
			this.update({
				posting: true
			});

			this.api('posts/create', {
				text: this.refs.text.value
			}).then(data => {
				this.clear();
			}).catch(err => {
				alert('失敗した');
			}).then(() => {
				this.update({
					posting: false
				});
			});
		};

		this.clear = () => {
			this.refs.text.value = '';
		};
	</script>
</mk-post-form-home-widget>
