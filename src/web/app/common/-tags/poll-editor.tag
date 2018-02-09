<mk-poll-editor>
	<p class="caution" v-if="choices.length < 2">
		%fa:exclamation-triangle%%i18n:common.tags.mk-poll-editor.no-only-one-choice%
	</p>
	<ul ref="choices">
		<li each={ choice, i in choices }>
			<input value={ choice } oninput={ oninput.bind(null, i) } placeholder={ '%i18n:common.tags.mk-poll-editor.choice-n%'.replace('{}', i + 1) }>
			<button @click="remove.bind(null, i)" title="%i18n:common.tags.mk-poll-editor.remove%">
				%fa:times%
			</button>
		</li>
	</ul>
	<button class="add" v-if="choices.length < 10" @click="add">%i18n:common.tags.mk-poll-editor.add%</button>
	<button class="destroy" @click="destroy" title="%i18n:common.tags.mk-poll-editor.destroy%">
		%fa:times%
	</button>
	<style lang="stylus" scoped>
		:scope
			display block
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
						padding 6px
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

	</style>
	<script lang="typescript">
		this.choices = ['', ''];

		this.oninput = (i, e) => {
			this.choices[i] = e.target.value;
		};

		this.add = () => {
			this.choices.push('');
			this.update();
			this.$refs.choices.childNodes[this.choices.length - 1].childNodes[0].focus();
		};

		this.remove = (i) => {
			this.choices = this.choices.filter((_, _i) => _i != i);
			this.update();
		};

		this.destroy = () => {
			this.opts.ondestroy();
		};

		this.get = () => {
			return {
				choices: this.choices.filter(choice => choice != '')
			}
		};

		this.set = data => {
			if (data.choices.length == 0) return;
			this.choices = data.choices;
		};
	</script>
</mk-poll-editor>
