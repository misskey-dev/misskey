<mk-go-top>
	<button class="hidden" title="一番上へ"><i class="fa fa-angle-up"></i></button>
	<script>
		window.addEventListener 'load' this.on-scroll
		window.addEventListener 'scroll' this.on-scroll
		window.addEventListener 'resize' this.on-scroll

		this.on-scroll = () => {
			if $ window .scroll-top! > 500px
				@remove-class 'hidden' 
			else
				@add-class 'hidden' 
	</script>
</mk-go-top>
