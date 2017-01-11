<mk-go-top>
	<button class="hidden" title="一番上へ"><i class="fa fa-angle-up"></i></button>
	<script>
		window.add-event-listener \load @on-scroll
		window.add-event-listener \scroll @on-scroll
		window.add-event-listener \resize @on-scroll

		@on-scroll = ~>
			if $ window .scroll-top! > 500px
				@remove-class \hidden
			else
				@add-class \hidden
	</script>
</mk-go-top>
