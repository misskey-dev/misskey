<mk-api-info>
	<p>Token:<code>{ I.token }</code></p>
	<p>APIを利用するには、上記のトークンを「i」というキーでパラメータに付加してリクエストします。</p>
	<p>アカウントを乗っ取られてしまう可能性があるため、このトークンは第三者に教えないでください(アプリなどにも入力しないでください)。</p>
	<p>万が一このトークンが漏れたりその可能性がある場合は
		<button class="regenerate" onclick={ regenerateToken }>トークンを再生成</button>できます。(副作用として、ログインしているすべてのデバイスでログアウトが発生します)
	</p>
	<style>
		:scope
			display block
			color #4a535a

			code
				padding 4px
				background #eee

			.regenerate
				display inline
				color $theme-color

				&:hover
					text-decoration underline
	</style>
	<script>
		this.mixin('i');
	</script>
</mk-api-info>
