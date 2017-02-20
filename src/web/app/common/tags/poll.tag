<mk-poll data-is-voted={ isVoted }>
	<ul>
		<li each={ poll.choices } onclick={ vote.bind(null, id) } class={ voted: voted } title={ !parent.isVoted ? '「' + text + '」に投票する' : '' }>
			<div class="backdrop" style={ 'width:' + (parent.result ? (votes / parent.total * 100) : 0) + '%' }></div>
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
	<style>
		:scope
			display block

			> ul
				display block
				margin 0
				padding 0
				list-style none

				> li
					display block
					margin 4px 0
					padding 4px 8px
					width 100%
					border solid 1px #eee
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
						transition width 1s ease

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
		this.mixin('api');

		this.post = this.opts.post
		this.poll = @post.poll
		this.total = @poll.choices.reduce ((a, b) -> a + b.votes), 0
		this.is-voted = @poll.choices.some (c) -> c.is_voted
		this.result = @is-voted

		toggle-result() {
			this.result = !@result

		vote(id) {
			if (@poll.choices.some (c) -> c.is_voted) then return
			this.api 'posts/polls/vote' do
				post_id: @post.id
				choice: id
			.then =>
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
