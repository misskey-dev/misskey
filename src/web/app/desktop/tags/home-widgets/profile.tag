<mk-profile-home-widget data-compact={ data.compact }>
	<div class="banner" style={ I.banner_url ? 'background-image: url(' + I.banner_url + '?thumbnail&size=256)' : '' } title="クリックでバナー編集" onclick={ setBanner }></div>
	<img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } onclick={ setAvatar } alt="avatar" title="クリックでアバター編集" data-user-preview={ I.id }/>
	<a class="name" href={ '/' + I.username }>{ I.name }</a>
	<p class="username">@{ I.username }</p>
	<style>
		:scope
			display block
			overflow hidden
			background #fff

			&[data-compact]
				> .banner:before
					content ""
					display block
					width 100%
					height 100%
					background rgba(0, 0, 0, 0.5)

				> .avatar
					top 21px
					left 21px
					border none
					border-radius 100%

				> .name
					position absolute
					top 0
					left 92px
					margin 0
					line-height 100px
					color #fff

				> .username
					display none

			> .banner
				height 100px
				background-color #f5f5f5
				background-size cover
				background-position center
				cursor pointer

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
				cursor pointer

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

		this.data = {
			compact: false
		};

		this.mixin('widget');

		this.mixin('user-preview');

		this.setAvatar = () => {
			updateAvatar(this.I);
		};

		this.setBanner = () => {
			updateBanner(this.I);
		};

		this.func = () => {
			this.data.compact = !this.data.compact;
			this.save();
		};
	</script>
</mk-profile-home-widget>
