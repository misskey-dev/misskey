<mk-poll data-is-voted={ isVoted }>
	<ul>
		<li each={ poll.choices } onclick={ vote.bind(null, id) } class={ voted: voted } title={ !parent.isVoted ? '「' + text + '」に投票する' : '' }>
			<div class="backdrop" if={ parent.result } style={ 'width:' + (votes / parent.total * 100) + '%' }></div>
			<span>
				<i class="fa fa-check" if={ is_voted }></i>
				{ text }
				<span class="votes" if={ parent.result }>({ votes }票)</span>
			</span>
		</li>
	</ul>
	<p if={ total > 0 }>
		<span>{ total }人が投票</span>
		・
		<a if={ !isVoted } onclick={ toggleResult }>{ result ? '投票する' : '結果を見る' }</a>
		<span if={ isVoted }>投票済み</span>
	</p>
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

			> p
				a
					color inherit

			&[data-is-voted]
				> ul > li
					cursor default

					&:hover
						background transparent

					&:active
						background transparent

	</style>
	<script>
		@mixin \api

		@post = @opts.post
		@poll = @post.poll
		@total = @poll.choices.reduce ((a, b) -> a + b.votes), 0
		@is-voted = @poll.choices.some (c) -> c.is_voted
		@result = @is-voted

		@toggle-result = ~>
			@result = !@result

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
					is-voted: true
					result: true
					total: @total + 1

	</script>
</mk-poll>
