<mk-repost-form-window>
	<mk-window ref="window" is-modal={ true } colored={ true }><yield to="header"><i class="fa fa-retweet"></i>この投稿をRepostしますか？</yield>
<yield to="content">
		<mk-repost-form ref="form" post={ parent.opts.post }></mk-repost-form></yield>
	</mk-window>
	<style>
		:scope
			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

	</style>
	<script>
		this.on-document-keydown = (e) => {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 27 // Esc
					this.refs.window.close!

		this.on('mount', () => {
			this.refs.window.refs.form.on('cancel', () => {
				this.refs.window.close!

			this.refs.window.refs.form.on('posted', () => {
				this.refs.window.close!

			document.addEventListener 'keydown' this.on-document-keydown

			this.refs.window.on('closed', () => {
				this.unmount();

		this.on('unmount', () => {
			document.removeEventListener 'keydown' this.on-document-keydown
	</script>
</mk-repost-form-window>
