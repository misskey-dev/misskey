<mk-stream-indicator>
	<p if={ state == 'initializing' }><i class="fa fa-spinner fa-spin"></i><span>接続中
			<mk-ellipsis></mk-ellipsis></span></p>
	<p if={ state == 'reconnecting' }><i class="fa fa-spinner fa-spin"></i><span>切断されました 接続中
			<mk-ellipsis></mk-ellipsis></span></p>
	<p if={ state == 'connected' }><i class="fa fa-check"></i><span>接続完了</span></p>
	<style>
		:scope
			display block
			pointer-events none
			position fixed
			z-index 16384
			bottom 8px
			right 8px
			margin 0
			padding 6px 12px
			font-size 0.9em
			color #fff
			background rgba(0, 0, 0, 0.8)

			> p
				display block
				margin 0

				> i
					margin-right 0.25em

	</style>
	<script>
		this.mixin('stream');

		this.on('before-mount', () => {
			this.state = this.getStreamState();

			if this.state == 'connected' 
				this.root.style.opacity = 0

		this.stream-state-ev.on('connected', () => {
			this.state = this.getStreamState();
			this.update();
			setTimeout =>
				Velocity(this.root, {
					opacity: 0
				} 200ms 'linear' 
			, 1000ms

		this.stream-state-ev.on('closed', () => {
			this.state = this.getStreamState();
			this.update();
			Velocity(this.root, {
				opacity: 1
			} 0ms
	</script>
</mk-stream-indicator>
