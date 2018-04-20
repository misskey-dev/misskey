<template>
<div class="mk-poll" :data-is-voted="isVoted">
	<ul>
		<li v-for="choice in poll.choices" :key="choice.id" @click="vote(choice.id)" :class="{ voted: choice.voted }" :title="!isVoted ? '%i18n:!@vote-to%'.replace('{}', choice.text) : ''">
			<div class="backdrop" :style="{ 'width': (showResult ? (choice.votes / total * 100) : 0) + '%' }"></div>
			<span>
				<template v-if="choice.isVoted">%fa:check%</template>
				<span>{{ choice.text }}</span>
				<span class="votes" v-if="showResult">({{ '%i18n:!@vote-count%'.replace('{}', choice.votes) }})</span>
			</span>
		</li>
	</ul>
	<p v-if="total > 0">
		<span>{{ '%i18n:!@total-users%'.replace('{}', total) }}</span>
		<span>・</span>
		<a v-if="!isVoted" @click="toggleShowResult">{{ showResult ? '%i18n:!@vote%' : '%i18n:!@show-result%' }}</a>
		<span v-if="isVoted">%i18n:@voted%</span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['note'],
	data() {
		return {
			showResult: false
		};
	},
	computed: {
		poll(): any {
			return this.note.poll;
		},
		total(): number {
			return this.poll.choices.reduce((a, b) => a + b.votes, 0);
		},
		isVoted(): boolean {
			return this.poll.choices.some(c => c.isVoted);
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
			if (this.poll.choices.some(c => c.isVoted)) return;
			(this as any).api('notes/polls/vote', {
				noteId: this.note.id,
				choice: id
			}).then(() => {
				this.poll.choices.forEach(c => {
					if (c.id == id) {
						c.votes++;
						Vue.set(c, 'isVoted', true);
					}
				});
				this.showResult = true;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)

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
			color isDark ? #fff : #000
			border solid 1px isDark ? #5e636f : #eee
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

			> span
				> [data-fa]
					margin-right 4px

				> .votes
					margin-left 4px

	> p
		color isDark ? #a3aebf : #000

		a
			color inherit

	&[data-is-voted]
		> ul > li
			cursor default

			&:hover
				background transparent

			&:active
				background transparent

.mk-poll[data-darkmode]
	root(true)

.mk-poll:not([data-darkmode])
	root(false)

</style>
