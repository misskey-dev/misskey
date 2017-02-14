<mk-poll-editor>
	<ul>
		<li each={ choice, i in choices }>
			<input value={ choice } oninput={ oninput.bind(null, i) }>
			<button onclick={ remove.bind(null, i) }>削除</button>
		</li>
	</ul>
	<button onclick={ add }>選択肢を追加</button>
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
					padding 8px 12px
					width 100%

	</style>
	<script>
		@choices = ['', '']

		@oninput = (i, e) ~>
			@choices[i] = e.target.value

		@add = ~>
			@choices.push ''
			@update!

		@remove = (i) ~>
			console.log i
			console.log @choices.filter((_, _i) -> _i != i)
			@choices = @choices.filter((_, _i) -> _i != i)
			@update!

		@get = ~>
			return {
				choices: @choices.filter (choice) -> choice != ''
			}
	</script>
</mk-poll-editor>
