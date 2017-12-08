<mk-api-info-page>
	<mk-ui ref="ui">
		<mk-api-info/>
	</mk-ui>
	<style>
		:scope
			display block
	</style>
	<script>
		import ui from '../../../scripts/ui-event';

		this.on('mount', () => {
			document.title = 'Misskey | API';
			ui.trigger('title', '%fa:key%API');
		});
	</script>
</mk-api-info-page>

<mk-api-info>
	<p>Token:<code>{ I.token }</code></p>
	<p>APIを利用するには、上記のトークンを「i」というキーでパラメータに付加してリクエストします。</p>
	<p>アカウントを乗っ取られてしまう可能性があるため、このトークンは第三者に教えないでください(アプリなどにも入力しないでください)。</p>
	<p>万が一このトークンが漏れたりその可能性がある場合はデスクトップ版Misskeyから再生成できます。</p>
	<style>
		:scope
			display block
			color #4a535a

			code
				padding 4px
				background #eee
	</style>
	<script>
		this.mixin('i');
	</script>
</mk-api-info>
