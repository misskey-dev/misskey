<template>
<div :data-is-voted="isVoted">
	<ul>
		<li v-for="choice in poll.choices" :key="choice.id" @click="vote.bind(choice.id)" :class="{ voted: choice.voted }" :title="!isVoted ? '%i18n:common.tags.mk-poll.vote-to%'.replace('{}', choice.text) : ''">
			<div class="backdrop" :style="{ 'width:' + (showResult ? (choice.votes / total * 100) : 0) + '%' }"></div>
			<span>
				<template v-if="choice.is_voted">%fa:check%</template>
				{{ text }}
				<span class="votes" v-if="showResult">({{ '%i18n:common.tags.mk-poll.vote-count%'.replace('{}', choice.votes) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="total > 0">
		<span>{{ '%i18n:common.tags.mk-poll.total-users%'.replace('{}', total) }}</span>
		・
		<a v-if="!isVoted" @click="toggleShowResult">{{ showResult ? '%i18n:common.tags.mk-poll.vote%' : '%i18n:common.tags.mk-poll.show-result%' }}</a>
		<span v-if="isVoted">%i18n:common.tags.mk-poll.voted%</span>
	</p>
</div>
</template>

<script lang="typescript">
	export default {
		props: ['post'],
		data() {
			return {
				showResult: false
			};
		},
		computed: {
			poll() {
				return this.post.poll;
			},
			total() {
				return this.poll.choices.reduce((a, b) => a + b.votes, 0);
			},
			isVoted() {
				return this.poll.choices.some(c => c.is_voted);
			}
		},
		created() {
			this.showResult = this.isVoted;
		},
		methods: {
			toggleShowResult() {
				this.showResult = !this.showResult;
			},
			vote(id) {
				if (this.poll.choices.some(c => c.is_voted)) return;
				(this as any).api('posts/polls/vote', {
					post_id: this.post.id,
					choice: id
				}).then(() => {
					this.poll.choices.forEach(c => {
						if (c.id == id) {
							c.votes++;
							c.is_voted = true;
						}
					});
					this.showResult = true;
				});
			}
		}
	};
</script>

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
