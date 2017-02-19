<mk-twitter-setting>
	<p>お使いのTwitterアカウントをお使いのMisskeyアカウントに接続しておくと、プロフィールでTwitterアカウント情報が表示されるようになったり、Twitterを用いた便利なサインインを利用できるようになります。<a href={ CONFIG.aboutUrl + '/link-to-twitter' } target="_blank">詳細...</a></p>
	<p class="account" if={ I.twitter } title={ 'Twitter ID: ' + I.twitter.user_id }>次のTwitterアカウントに接続されています: <a href={ 'https://twitter.com/' + I.twitter.screen_name } target="_blank">@{ I.twitter.screen_name }</a></p>
	<p>
		<a href={ CONFIG.apiUrl + '/connect/twitter' } target="_blank">{ I.twitter ? '再接続する' : 'Twitterと接続する' }</a>
		<span if={ I.twitter }> or </span>
		<a href={ CONFIG.apiUrl + '/disconnect/twitter' } target="_blank" if={ I.twitter }>切断する</a>
	</p>
	<p class="id" if={ I.twitter }>Twitter ID: { I.twitter.user_id }</p>
	<style>
		:scope
			display block

			.account
				border solid 1px #e1e8ed
				border-radius 4px
				padding 16px

				a
					font-weight bold
					color inherit

			.id
				color #8899a6
	</style>
	<script>
		@mixin \i
	</script>
</mk-twitter-setting>
