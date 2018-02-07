<mk-poll data-is-voted={ isVoted }>
	<ul>
		<li each={ poll.choices } @click="vote.bind(null, id)" class={ voted: voted } title={ !parent.isVoted ? '%i18n:common.tags.mk-poll.vote-to%'.replace('{}', text) : '' }>
			<div class="backdrop" style={ 'width:' + (parent.result ? (votes / parent.total * 100) : 0) + '%' }></div>
			<span>
				<virtual v-if="is_voted">%fa:check%</virtual>
				{ text }
				<span class="votes" v-if="parent.result">({ '%i18n:common.tags.mk-poll.vote-count%'.replace('{}', votes) })</span>
			</span>
		</li>
	</ul>
	<p v-if="total > 0">
		<span>{ '%i18n:common.tags.mk-poll.total-users%'.replace('{}', total) }</span>
		・
		<a v-if="!isVoted" @click="toggleResult">{ result ? '%i18n:common.tags.mk-poll.vote%' : '%i18n:common.tags.mk-poll.show-result%' }</a>
		<span v-if="isVoted">%i18n:common.tags.mk-poll.voted%</span>
	</p>
	<style lang="stylus" scoped>
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

		this.init = post => {
			this.post = post;
			this.poll = this.post.poll;
			this.total = this.poll.choices.reduce((a, b) => a + b.votes, 0);
			this.isVoted = this.poll.choices.some(c => c.is_voted);
			this.result = this.isVoted;
			this.update();
		};

		this.init(this.opts.post);

		this.toggleResult = () => {
			this.result = !this.result;
		};

		this.vote = id => {
			if (this.poll.choices.some(c => c.is_voted)) return;
			this.api('posts/polls/vote', {
				post_id: this.post.id,
				choice: id
			}).then(() => {
				this.poll.choices.forEach(c => {
					if (c.id == id) {
						c.votes++;
						c.is_voted = true;
					}
				});
				this.update({
					poll: this.poll,
					isVoted: true,
					result: true,
					total: this.total + 1
				});
			});
		};
	</script>
</mk-poll>
