<mk-entrance>
	<main>
		<img src="/assets/title.svg" alt="Misskey"/>
		<mk-entrance-signin if={ mode == 'signin' }/>
		<mk-entrance-signup if={ mode == 'signup' }/>
		<div class="introduction" if={ mode == 'introduction' }>
			<mk-introduction/>
			<button onclick={ signin }>わかった</button>
		</div>
	</main>
	<mk-forkit/>
	<footer>
		<mk-copyright/>
	</footer>
	<!-- ↓ https://github.com/riot/riot/issues/2134 (将来的)-->
	<style data-disable-scope="data-disable-scope">
		#wait {
			right: auto;
			left: 15px;
		}
	</style>
	<style>
		:scope
			display block
			height 100%

			> main
				display block
				padding-bottom 16px

				> img
					display block
					width 160px
					height 170px
					margin 0 auto
					pointer-events none
					user-select none

				> .introduction
					max-width 360px
					margin 0 auto
					color #777

					> mk-introduction
						padding 32px
						background #fff
						box-shadow 0 4px 16px rgba(0, 0, 0, 0.2)

					> button
						display block
						margin 16px auto 0 auto
						color #666

						&:hover
							text-decoration underline

			> .tl
				padding 32px 0
				background #fff

				> h2
					display block
					margin 0
					padding 0
					text-align center
					font-size 20px
					color #5b6b73

				> mk-public-timeline
					max-width 500px
					margin 0 auto
			> footer
				> mk-copyright
					margin 0
					text-align center
					line-height 64px
					font-size 10px
					color rgba(#000, 0.5)

	</style>
	<script>
		this.mode = 'signin';

		this.signup = () => {
			this.update({
				mode: 'signup'
			});
		};

		this.signin = () => {
			this.update({
				mode: 'signin'
			});
		};

		this.introduction = () => {
			this.update({
				mode: 'introduction'
			});
		};
	</script>
</mk-entrance>
