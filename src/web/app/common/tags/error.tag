<mk-error>
	<img src="data:image/jpeg;base64,%base64:/assets/error.jpg%" alt=""/>
	<h1>%i18n:common.tags.mk-error.title%</h1>
	<p class="text">{
		'%i18n:common.tags.mk-error.description%'.substr(0, '%i18n:common.tags.mk-error.description%'.indexOf('{'))
	}<a @click="reload">{
		'%i18n:common.tags.mk-error.description%'.match(/\{(.+?)\}/)[1]
	}</a>{
		'%i18n:common.tags.mk-error.description%'.substr('%i18n:common.tags.mk-error.description%'.indexOf('}') + 1)
	}</p>
	<button if={ !troubleshooting } @click="troubleshoot">%i18n:common.tags.mk-error.troubleshoot%</button>
	<mk-troubleshooter if={ troubleshooting }/>
	<p class="thanks">%i18n:common.tags.mk-error.thanks%</p>
	<style>
		:scope
			display block
			width 100%
			padding 32px 18px
			text-align center

			> img
				display block
				height 200px
				margin 0 auto
				pointer-events none
				user-select none

			> h1
				display block
				margin 1.25em auto 0.65em auto
				font-size 1.5em
				color #555

			> .text
				display block
				margin 0 auto
				max-width 600px
				font-size 1em
				color #666

			> button
				display block
				margin 1em auto 0 auto
				padding 8px 10px
				color $theme-color-foreground
				background $theme-color

				&:focus
					outline solid 3px rgba($theme-color, 0.3)

				&:hover
					background lighten($theme-color, 10%)

				&:active
					background darken($theme-color, 10%)

			> mk-troubleshooter
				margin 1em auto 0 auto

			> .thanks
				display block
				margin 2em auto 0 auto
				padding 2em 0 0 0
				max-width 600px
				font-size 0.9em
				font-style oblique
				color #aaa
				border-top solid 1px #eee

			@media (max-width 500px)
				padding 24px 18px
				font-size 80%

				> img
					height 150px

	</style>
	<script>
		this.troubleshooting = false;

		this.on('mount', () => {
			document.title = 'Oops!';
			document.documentElement.style.background = '#f8f8f8';
		});

		this.reload = () => {
			location.reload();
		};

		this.troubleshoot = () => {
			this.update({
				troubleshooting: true
			});
		};
	</script>
</mk-error>

<mk-troubleshooter>
	<h1>%fa:wrench%%i18n:common.tags.mk-error.troubleshooter.title%</h1>
	<div>
		<p data-wip={ network == null }><virtual if={ network != null }><virtual if={ network }>%fa:check%</virtual><virtual if={ !network }>%fa:times%</virtual></virtual>{ network == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-network%' : '%i18n:common.tags.mk-error.troubleshooter.network%' }<mk-ellipsis if={ network == null }/></p>
		<p if={ network == true } data-wip={ internet == null }><virtual if={ internet != null }><virtual if={ internet }>%fa:check%</virtual><virtual if={ !internet }>%fa:times%</virtual></virtual>{ internet == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-internet%' : '%i18n:common.tags.mk-error.troubleshooter.internet%' }<mk-ellipsis if={ internet == null }/></p>
		<p if={ internet == true } data-wip={ server == null }><virtual if={ server != null }><virtual if={ server }>%fa:check%</virtual><virtual if={ !server }>%fa:times%</virtual></virtual>{ server == null ? '%i18n:common.tags.mk-error.troubleshooter.checking-server%' : '%i18n:common.tags.mk-error.troubleshooter.server%' }<mk-ellipsis if={ server == null }/></p>
	</div>
	<p if={ !end }>%i18n:common.tags.mk-error.troubleshooter.finding%<mk-ellipsis/></p>
	<p if={ network === false }><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-network%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-network-desc%</p>
	<p if={ internet === false }><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-internet%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-internet-desc%</p>
	<p if={ server === false }><b>%fa:exclamation-triangle%%i18n:common.tags.mk-error.troubleshooter.no-server%</b><br>%i18n:common.tags.mk-error.troubleshooter.no-server-desc%</p>
	<p if={ server === true } class="success"><b>%fa:info-circle%%i18n:common.tags.mk-error.troubleshooter.success%</b><br>%i18n:common.tags.mk-error.troubleshooter.success-desc%</p>

	<style>
		:scope
			display block
			width 100%
			max-width 500px
			text-align left
			background #fff
			border-radius 8px
			border solid 1px #ddd

			> h1
				margin 0
				padding 0.6em 1.2em
				font-size 1em
				color #444
				border-bottom solid 1px #eee

				> [data-fa]
					margin-right 0.25em

			> div
				overflow hidden
				padding 0.6em 1.2em

				> p
					margin 0.5em 0
					font-size 0.9em
					color #444

					&[data-wip]
						color #888

					> [data-fa]
						margin-right 0.25em

						&.times
							color #e03524

						&.check
							color #84c32f

			> p
				margin 0
				padding 0.6em 1.2em
				font-size 1em
				color #444
				border-top solid 1px #eee

				> b
					> [data-fa]
						margin-right 0.25em

				&.success
					> b
						color #39adad

				&:not(.success)
					> b
						color #ad4339

	</style>
	<script>
		this.on('mount', () => {
			this.update({
				network: navigator.onLine
			});

			if (!this.network) {
				this.update({
					end: true
				});
				return;
			}

			// Check internet connection
			fetch('https://google.com?rand=' + Math.random(), {
				mode: 'no-cors'
			}).then(() => {
				this.update({
					internet: true
				});

				// Check misskey server is available
				fetch(`${_API_URL_}/meta`).then(() => {
					this.update({
						end: true,
						server: true
					});
				})
				.catch(() => {
					this.update({
						end: true,
						server: false
					});
				});
			})
			.catch(() => {
				this.update({
					end: true,
					internet: false
				});
			});
		});
	</script>
</mk-troubleshooter>
