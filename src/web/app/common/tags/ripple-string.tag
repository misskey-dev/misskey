<mk-ripple-string><yield/>
	<style>
		:scope
			display inline

			> span
				animation ripple-string 5s infinite ease-in-out both

			@keyframes ripple-string
				0%, 50%, 100%
					opacity 1
				25%
					opacity 0.5

	</style>
	<script>
		this.on('mount', () => {
			text = this.root.innerHTML
			this.root.innerHTML = ''
			(text.split '').forEach (c, i) =>
				ce = document.createElement 'span' 
				ce.innerHTML = c
				ce.style.animationDelay = (i / 10) + 's'
				this.root.appendChild ce
	</script>
</mk-ripple-string>
