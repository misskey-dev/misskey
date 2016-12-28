class Follower
	(el) ->
		@follower = el
		@last-scroll-top = window.scroll-y
		@initial-follower-top = @follower.get-bounding-client-rect!.top
		@page-top = 48

	follow: ->
		window-height = window.inner-height
		follower-height = @follower.offset-height

		scroll-top = window.scroll-y
		scroll-bottom = scroll-top + window-height

		follower-top = @follower.get-bounding-client-rect!.top + scroll-top
		follower-bottom = follower-top + follower-height

		height-delta = Math.abs window-height - follower-height
		scroll-delta = @last-scroll-top - scroll-top

		is-scrolling-down = (scroll-top > @last-scroll-top)
		is-window-larger = (window-height > follower-height)

		console.log @initial-follower-top

		if (is-window-larger && scroll-top > @initial-follower-top) || (!is-window-larger && scroll-top > @initial-follower-top + height-delta)
			@follower.class-list.add \fixed
		else if !is-scrolling-down && scroll-top + @page-top <= @initial-follower-top
			@follower.class-list.remove \fixed
			@follower.style.top = 0
			return

		drag-bottom-down = (follower-bottom <= scroll-bottom && is-scrolling-down)
		drag-top-up = (follower-top >= scroll-top + @page-top && !is-scrolling-down)

		if drag-bottom-down
			console.log \down
			@follower.style.top = if is-window-larger then 0 else -height-delta + \px
		else if drag-top-up
			console.log \up
			@follower.style.top = @page-top + \px
		else if @follower.class-list.contains \fixed
			console.log \-
			current-top = parse-int @follower.style.top, 10

			min-top = -height-delta
			scrolled-top = current-top + scroll-delta

			is-page-at-bottom = (scroll-top + window-height >= document.body.offset-height)
			new-top = if is-page-at-bottom then min-top else scrolled-top

			@follower.style.top = new-top + \px

		@last-scroll-top = scroll-top

module.exports = Follower
