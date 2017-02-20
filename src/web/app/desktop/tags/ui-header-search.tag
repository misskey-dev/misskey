<mk-ui-header-search>
	<form class="search" onsubmit={ onsubmit }>
		<input ref="q" type="search" placeholder="&#xf002; 検索"/>
		<div class="result"></div>
	</form>
	<style>
		:scope

			> form
				display block
				float left

				> input
					user-select text
					cursor auto
					margin 0
					padding 6px 18px
					width 14em
					height 48px
					font-size 1em
					line-height calc(48px - 12px)
					background transparent
					outline none
					//border solid 1px #ddd
					border none
					border-radius 0
					transition color 0.5s ease, border 0.5s ease
					font-family FontAwesome, sans-serif

					&::-webkit-input-placeholder
						color #9eaba8

	</style>
	<script>
		this.mixin('page');

		this.onsubmit = e => {
			e.preventDefault();
			this.page('/search:' + this.refs.q.value);
		};
	</script>
</mk-ui-header-search>
