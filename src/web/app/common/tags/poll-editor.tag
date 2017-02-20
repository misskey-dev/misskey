<mk-poll-editor>
	<p class="caution" if={ choices.length < 2 }>
		<i class="fa fa-exclamation-triangle"></i>投票には、選択肢が最低2つ必要です
	</p>
	<ul ref="choices">
		<li each={ choice, i in choices }>
			<input value={ choice } oninput={ oninput.bind(null, i) } placeholder={ '選択肢' + (i + 1) }>
			<button onclick={ remove.bind(null, i) } title="この選択肢を削除">
				<i class="fa fa-times"></i>
			</button>
		</li>
	</ul>
	<button class="add" if={ choices.length < 10 } onclick={ add }>+選択肢を追加</button>
	<button class="destroy" onclick={ destroy } title="投票を破棄">
		<i class="fa fa-times"></i>
	</button>
	<style>
		:scope
			display block
			padding 8px

			> .caution
				margin 0 0 8px 0
				font-size 0.8em
				color #f00

				> i
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
	<script>
		this.choices = ['', ''];

		oninput(i, e) {
			this.choices[i] = e.target.value;
		}

		add() {
			this.choices.push('');
			this.update();
			this.refs.choices.childNodes[this.choices.length - 1].childNodes[0].focus();
		}

		remove(i) {
			this.choices = this.choices.filter((_, _i) => _i != i);
			this.update();
		}

		destroy() {
			this.opts.ondestroy();
		}

		get() {
			return {
				choices: this.choices.filter(choice => choice != '')
			}
		}
	</script>
</mk-poll-editor>
