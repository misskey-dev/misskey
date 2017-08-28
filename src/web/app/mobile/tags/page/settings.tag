<mk-settings-page>
	<mk-ui ref="ui">
		<mk-settings />
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | %i18n:mobile.tags.mk-settings-page.settings%';
			ui.trigger('title', '<i class="fa fa-cog"></i>%i18n:mobile.tags.mk-settings-page.settings%');
			document.documentElement.style.background = '#eee';
		});
	</script>
</mk-settings-page>

<mk-settings>
	<p><mk-raw content={ '%i18n:mobile.tags.mk-settings.signed-in-as%'.replace('{}', '<b>' + I.name + '</b>') }/></p>
	<ul>
		<li><a href="./settings/profile"><i class="fa fa-user"></i>%i18n:mobile.tags.mk-settings-page.profile%<i class="fa fa-angle-right"></i></a></li>
		<li><a href="./settings/authorized-apps"><i class="fa fa-puzzle-piece"></i>%i18n:mobile.tags.mk-settings-page.applications%<i class="fa fa-angle-right"></i></a></li>
		<li><a href="./settings/twitter"><i class="fa fa-twitter"></i>%i18n:mobile.tags.mk-settings-page.twitter-integration%<i class="fa fa-angle-right"></i></a></li>
		<li><a href="./settings/signin-history"><i class="fa fa-sign-in"></i>%i18n:mobile.tags.mk-settings-page.signin-history%<i class="fa fa-angle-right"></i></a></li>
		<li><a href="./settings/api"><i class="fa fa-key"></i>%i18n:mobile.tags.mk-settings-page.api%<i class="fa fa-angle-right"></i></a></li>
	</ul>
	<ul>
		<li><a onclick={ signout }><i class="fa fa-power-off"></i>%i18n:mobile.tags.mk-settings-page.signout%</a></li>
	</ul>
	<style>
		:scope
			display block

			> p
				display block
				margin 24px
				text-align center
				color #555

			> ul
				display block
				margin 16px 0
				padding 0
				list-style none
				border-top solid 1px #aaa

				> li
					display block
					background #fff
					border-bottom solid 1px #aaa

					> a
						$height = 48px

						display block
						position relative
						padding 0 16px
						line-height $height
						color #4d635e

						> i:nth-of-type(1)
							margin-right 4px

						> i:nth-of-type(2)
							display block
							position absolute
							top 0
							right 8px
							z-index 1
							padding 0 20px
							font-size 1.2em
							line-height $height

	</style>
	<script>
		import signout from '../../../common/scripts/signout';
		this.signout = signout;

		this.mixin('i');
	</script>
</mk-settings>
