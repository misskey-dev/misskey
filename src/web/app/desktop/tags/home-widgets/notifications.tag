<mk-notifications-home-widget>
	<virtual if={ !data.compact }>
		<p class="title"><i class="fa fa-bell-o"></i>%i18n:desktop.tags.mk-notifications-home-widget.title%</p>
		<button onclick={ settings } title="%i18n:desktop.tags.mk-notifications-home-widget.settings%"><i class="fa fa-cog"></i></button>
	</virtual>
	<mk-notifications/>
	<style>
		:scope
			display block
			background #fff
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

				> i
					margin-right 4px

			> button
				position absolute
				z-index 2
				top 0
				right 0
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color #ccc

				&:hover
					color #aaa

				&:active
					color #999

			> mk-notifications
				max-height 300px
				overflow auto

	</style>
	<script>
		this.data = {
			compact: false
		};

		this.mixin('widget');

		this.settings = () => {
			const w = riot.mount(document.body.appendChild(document.createElement('mk-settings-window')))[0];
			w.switch('notification');
		};

		this.func = () => {
			this.data.compact = !this.data.compact;
			this.save();
		};
	</script>
</mk-notifications-home-widget>
