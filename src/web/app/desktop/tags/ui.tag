<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header" page={ opts.page }></mk-ui-header>
		<mk-set-avatar-suggestion if={ SIGNIN && I.avatar_id == null }></mk-set-avatar-suggestion>
		<mk-set-banner-suggestion if={ SIGNIN && I.banner_id == null }></mk-set-banner-suggestion>
		<div class="content"><yield /></div>
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('i');

		open-post-form() {
			riot.mount document.body.appendChild document.createElement 'mk-post-form-window' 

		set-root-layout() {
			this.root.style.padding-top = this.refs.header.root.client-height + 'px' 

		this.on('mount', () => {
			@set-root-layout!
			document.add-event-listener 'keydown' this.onkeydown

		this.on('unmount', () => {
			document.remove-event-listener 'keydown' this.onkeydown

		onkeydown(e) {
			tag = e.target.tag-name.to-lower-case!
			if tag != 'input' and tag != 'textarea' 
				if e.which == 80 or e.which == 78 // p or n
					e.preventDefault();
					@open-post-form!
	</script>
</mk-ui>
