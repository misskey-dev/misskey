mk-go-top
	button.hidden(title='一番上へ')
		i.fa.fa-angle-up

script.

	window.add-event-listener \load @on-scroll
	window.add-event-listener \scroll @on-scroll
	window.add-event-listener \resize @on-scroll

	@on-scroll = ~>
		if $ window .scroll-top! > 500px
			@remove-class \hidden
		else
			@add-class \hidden
