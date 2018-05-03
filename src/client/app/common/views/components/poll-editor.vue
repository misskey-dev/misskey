<template>
<div class="mk-poll-editor">
	<p class="caution" v-if="choices.length < 2">
		%fa:exclamation-triangle%%i18n:@no-only-one-choice%
	</p>
	<ul ref="choices">
		<li v-for="(choice, i) in choices">
			<input :value="choice" @input="onInput(i, $event)" :placeholder="'%i18n:!@choice-n%'.replace('{}', i + 1)">
			<button @click="remove(i)" title="%i18n:@remove%">
				%fa:times%
			</button>
		</li>
	</ul>
	<button class="add" v-if="choices.length < 10" @click="add">%i18n:@add%</button>
	<button class="destroy" @click="destroy" title="%i18n:@destroy%">
		%fa:times%
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			choices: ['', '']
		};
	},
	watch: {
		choices() {
			this.$emit('updated');
		}
	},
	methods: {
		onInput(i, e) {
			Vue.set(this.choices, i, e.target.value);
		},

		add() {
			this.choices.push('');
			this.$nextTick(() => {
				(this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
			});
		},

		remove(i) {
			this.choices = this.choices.filter((_, _i) => _i != i);
		},

		destroy() {
			this.$emit('destroyed');
		},

		get() {
			return {
				choices: this.choices.filter(choice => choice != '')
			}
		},

		set(data) {
			if (data.choices.length == 0) return;
			this.choices = data.choices;
			if (data.choices.length == 1) this.choices = this.choices.concat('');
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	padding 8px

	> .caution
		margin 0 0 8px 0
		font-size 0.8em
		color #f00

		> [data-fa]
			margin-right 4px

	> ul
		display block
		margin 0
		padding 0
		list-style none

		> li
			display block
			margin 8px 0
			padding 0
			width 100%

			&:first-child
				margin-top 0

			&:last-child
				margin-bottom 0

			> input
				padding 6px 8px
				width 300px
				font-size 14px
				color isDark ? #fff : #000
				background isDark ? #191b22 : #fff
				border solid 1px rgba($theme-color, 0.1)
				border-radius 4px

				&:hover
					border-color rgba($theme-color, 0.2)

				&:focus
					border-color rgba($theme-color, 0.5)

			> button
				padding 4px 8px
				color rgba($theme-color, 0.4)

				&:hover
					color rgba($theme-color, 0.6)

				&:active
					color darken($theme-color, 30%)

	> .add
		margin 8px 0 0 0
		vertical-align top
		color $theme-color

	> .destroy
		position absolute
		top 0
		right 0
		padding 4px 8px
		color rgba($theme-color, 0.4)

		&:hover
			color rgba($theme-color, 0.6)

		&:active
			color darken($theme-color, 30%)

.mk-poll-editor[data-darkmode]
	root(true)

.mk-poll-editor:not([data-darkmode])
	root(false)

</style>
