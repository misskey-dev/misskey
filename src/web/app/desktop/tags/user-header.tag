<mk-user-header data-is-dark-background={ user.banner_url != null }>
	<div class="banner" ref="banner" style={ user.banner_url ? 'background-image: url(' + user.banner_url + '?thumbnail&size=1024)' : '' } onclick={ onUpdateBanner }></div><img class="avatar" src={ user.avatar_url + '?thumbnail&size=150' } alt="avatar"/>
	<div class="title">
		<p class="name" href={ '/' + user.username }>{ user.name }</p>
		<p class="username">@{ user.username }</p>
		<p class="location" if={ user.profile.location }><i class="fa fa-map-marker"></i>{ user.profile.location }</p>
	</div>
	<footer>
		<a href={ '/' + user.username }>投稿</a>
		<a href={ '/' + user.username + '/media' }>メディア</a>
		<a href={ '/' + user.username + '/graphs' }>グラフ</a>
	</footer>
	<style>
		:scope
			$footer-height = 58px

			display block
			background #fff

			&[data-is-dark-background]
				> .banner
					background-color #383838

				> .title
					color #fff
					background linear-gradient(transparent, rgba(0, 0, 0, 0.7))

					> .name
						text-shadow 0 0 8px #000

			> .banner
				height 280px
				background-color #f5f5f5
				background-size cover
				background-position center

			> .avatar
				display block
				position absolute
				bottom 16px
				left 16px
				z-index 2
				width 150px
				height 150px
				margin 0
				border solid 3px #fff
				border-radius 8px
				box-shadow 1px 1px 3px rgba(0, 0, 0, 0.2)

			> .title
				position absolute
				bottom $footer-height
				left 0
				width 100%
				padding 0 0 8px 195px
				color #656565
				font-family '游ゴシック', 'YuGothic', 'ヒラギノ角ゴ ProN W3', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'メイリオ', sans-serif

				> .name
					display block
					margin 0
					line-height 40px
					font-weight bold
					font-size 2em

				> .username
				> .location
					display inline-block
					margin 0 16px 0 0
					line-height 20px
					opacity 0.8

					> i
						margin-right 4px

			> footer
				z-index 1
				height $footer-height
				padding-left 195px
				background #fff

				> a
					display inline-block
					margin 0
					width 100px
					line-height $footer-height
					color #555

				> button
					display block
					position absolute
					top 0
					right 0
					margin 8px
					padding 0
					width $footer-height - 16px
					line-height $footer-height - 16px - 2px
					font-size 1.2em
					color #777
					border solid 1px #eee
					border-radius 4px

					&:hover
						color #555
						border solid 1px #ddd

	</style>
	<script>
		import updateBanner from '../scripts/update-banner';

		this.mixin('i');

		this.user = this.opts.user;

		this.on('mount', () => {
			window.addEventListener('load', this.scroll);
			window.addEventListener('scroll', this.scroll);
			window.addEventListener('resize', this.scroll);
		});

		this.on('unmount', () => {
			window.removeEventListener('load', this.scroll);
			window.removeEventListener('scroll', this.scroll);
			window.removeEventListener('resize', this.scroll);
		});

		this.scroll = () => {
			const top = window.scrollY;
			const height = 280/*px*/;

			const pos = 50 - ((top / height) * 50);
			this.refs.banner.style.backgroundPosition = `center ${pos}%`;

			const blur = top / 32
			if (blur <= 10) this.refs.banner.style.filter = `blur(${blur}px)`;
		};

		this.onUpdateBanner = () => {
			if (!this.SIGNIN || this.I.id != this.user.id) return;

			updateBanner(this.I, i => {
				this.user.banner_url = i.banner_url;
				this.update();
			});
		};
	</script>
</mk-user-header>
