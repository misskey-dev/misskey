<mk-profile-home-widget data-compact={ data.design == 1 || data.design == 2 } data-melt={ data.design == 2 }>
	<div class="banner" style={ I.banner_url ? 'background-image: url(' + I.banner_url + '?thumbnail&size=256)' : '' } title="クリックでバナー編集" @click="setBanner"></div>
	<img class="avatar" src={ I.avatar_url + '?thumbnail&size=96' } @click="setAvatar" alt="avatar" title="クリックでアバター編集" data-user-preview={ I.id }/>
	<a class="name" href={ '/' + I.username }>{ I.name }</a>
	<p class="username">@{ I.username }</p>
	<style lang="stylus" scoped>
		:scope
			display block
			overflow hidden
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			&[data-compact]
				> .banner:before
					content ""
					display block
					width 100%
					height 100%
					background rgba(0, 0, 0, 0.5)

				> .avatar
					top ((100px - 58px) / 2)
					left ((100px - 58px) / 2)
					border none
					border-radius 100%
					box-shadow 0 0 16px rgba(0, 0, 0, 0.5)

				> .name
					position absolute
					top 0
					left 92px
					margin 0
					line-height 100px
					color #fff
					text-shadow 0 0 8px rgba(0, 0, 0, 0.5)

				> .username
					display none

			&[data-melt]
				background transparent !important
				border none !important

				> .banner
					visibility hidden

				> .avatar
					box-shadow none

				> .name
					color #666
					text-shadow none

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
	<script lang="typescript">
		import inputDialog from '../../scripts/input-dialog';
		import updateAvatar from '../../scripts/update-avatar';
		import updateBanner from '../../scripts/update-banner';

		this.data = {
			design: 0
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
			if (++this.data.design == 3) this.data.design = 0;
			this.save();
		};
	</script>
</mk-profile-home-widget>
