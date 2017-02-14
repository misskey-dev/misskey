<mk-poll>
	<ul>
		<li each={ poll.choices } onclick={ vote.bind(null, id) } class={ voted: voted }>
			<div class="backdrop" if={ parent.result } style={ 'width:' + (votes / parent.total * 100) + '%' }></div>
			<span>
				<i class="fa fa-check" if={ is_voted }></i>
				{ text }
				<span class="votes" if={ parent.result }>({ votes }票)</span>
			</span>
		</li>
	</ul>
	<p>{ total }人が投票</p>
	<style type="stylus">
		:scope
			display block

			> ul
				display block
				margin 0
				padding 0
				list-style none

				> li
					display block
					margin 4px
					padding 4px 8px
					width 100%
					border-radius 4px
					overflow hidden
					cursor pointer

					&:hover
						background rgba(0, 0, 0, 0.05)

					&:active
						background rgba(0, 0, 0, 0.1)

					> .backdrop
						position absolute
						top 0
						left 0
						height 100%
						background $theme-color

					> .votes
						margin-left 4px

	</style>
	<script>
		@mixin \api

		@post = @opts.post
		@poll = @post.poll
		@total = @poll.choices.reduce ((a, b) -> a + b.votes), 0
		@result = @poll.choices.some (c) -> c.is_voted

		@vote = (id) ~>
			if (@poll.choices.some (c) -> c.is_voted) then return
			@api \posts/polls/vote do
				post_id: @post.id
				choice: id
			.then ~>
				@poll.choices.for-each (c) ->
					if c.id == id
						c.votes++
						c.is_voted = true
				@update do
					poll: @poll
					result: true
					total: @total + 1

	</script>
</mk-poll>
