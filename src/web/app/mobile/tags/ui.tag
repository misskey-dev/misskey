<mk-ui>
	<div class="global" ref="global">
		<mk-ui-header ref="header" ready={ ready }></mk-ui-header>
		<mk-ui-nav ref="nav" ready={ ready }></mk-ui-nav>
		<div class="content" ref="main"><yield /></div>
	</div>
	<mk-stream-indicator></mk-stream-indicator>
	<style>
		:scope
			display block

			> .global
				> .content
					background #fff
	</style>
	<script>
		this.mixin('stream');

		this.ready-count = 0
		this.is-drawer-opening = false

		#this.ui.on('notification', (text) => {
		// alert text

		this.on('mount', () => {
			@stream.on 'notification' this.on-stream-notification
			@ready!

		this.on('unmount', () => {
			@stream.off 'notification' this.on-stream-notification

		ready() {
			@ready-count++

			if @ready-count == 2
				@init-view-position!

		init-view-position() {
			top = this.refs.header.root.offset-height
			this.refs.main.style.padding-top = top + 'px' 

		toggle-drawer() {
			this.is-drawer-opening = !@is-drawer-opening
			this.refs.nav.root.style.display = if @is-drawer-opening then 'block' else 'none' 

		on-stream-notification(notification) {
			el = document.body.appendChild document.createElement 'mk-notify' 
			riot.mount el, do
				notification: notification
	</script>
</mk-ui>
