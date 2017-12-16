<mk-entrance>
	<main><img src="/assets/title.svg" alt="Misskey"/>
		<mk-entrance-signin if={ mode == 'signin' }/>
		<mk-entrance-signup if={ mode == 'signup' }/>
		<div class="introduction" if={ mode == 'introduction' }>
			<mk-introduction/>
			<button onclick={ signin }>%i18n:common.ok%</button>
		</div>
	</main>
	<footer>
		<p class="c">{ _COPYRIGHT_ }</p>
	</footer>
	<style>
		:scope
			display block
			height 100%

			> main
				display block

				> img
					display block
					width 130px
					height 120px
					margin 0 auto

				> .introduction
					max-width 300px
					margin 0 auto
					color #666

					> button
						display block
						margin 16px auto 0 auto

			> footer
				> .c
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
