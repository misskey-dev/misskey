<mk-profile-home-widget>
	<div class="banner" style={ I.banner_url ? 'background-image: url(' + I.banner_url + '?thumbnail&size=256)' : '' } onclick={ setBanner }></div><img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } onclick={ setAvatar } alt="avatar" data-user-preview={ I.id }/><a class="name" href={ CONFIG.url + '/' + I.username }>{ I.name }</a>
	<p class="username">@{ I.username }</p>
	<style>
		:scope
			display block
			overflow hidden
			background #fff

			> .banner
				height 100px
				background-color #f5f5f5
				background-size cover
				background-position center

			> .avatar
				display block
				position absolute
				top 76px
				left 16px
				width 58px
				height 58px
				margin 0
				border solid 3px #fff
				border-radius 8px
				vertical-align bottom

			> .name
				display block
				margin 10px 0 0 84px
				line-height 16px
				font-weight bold
				color #555

			> .username
				display block
				margin 4px 0 8px 84px
				line-height 16px
				font-size 0.9em
				color #999

	</style>
	<script>
		import inputDialog from '../../scripts/input-dialog';
		import updateAvatar from '../../scripts/update-avatar';
		import updateBanner from '../../scripts/update-banner';

		this.mixin('i');
		this.mixin('user-preview');

		this.setAvatar = () => {
			updateAvatar(this.I);
		};

		this.setBanner = () => {
			updateBanner(this.I);
		};
	</script>
</mk-profile-home-widget>
