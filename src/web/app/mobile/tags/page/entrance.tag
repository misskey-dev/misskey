<mk-entrance>
	<main><img src="/_/resources/title.svg" alt="Misskey"/>
		<mk-entrance-signin if={ mode == 'signin' }></mk-entrance-signin>
		<mk-entrance-signup if={ mode == 'signup' }></mk-entrance-signup>
		<div class="introduction" if={ mode == 'introduction' }>
			<mk-introduction></mk-introduction>
			<button onclick={ signin }>わかった</button>
		</div>
	</main>
	<footer>
		<mk-copyright></mk-copyright>
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
				> mk-copyright
					margin 0
					text-align center
					line-height 64px
					font-size 10px
					color rgba(#000, 0.5)

	</style>
	<script>
		this.mode = 'signin' 

		signup() {
			this.mode = 'signup' 
			this.update();

		signin() {
			this.mode = 'signin' 
			this.update();

		introduction() {
			this.mode = 'introduction' 
			this.update();
	</script>
</mk-entrance>
