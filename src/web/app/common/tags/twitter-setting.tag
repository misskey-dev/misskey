<mk-twitter-setting>
	<p>%i18n:common.tags.mk-twitter-setting.description%<a href={ CONFIG.aboutUrl + '/link-to-twitter' } target="_blank">%i18n:common.tags.mk-twitter-setting.detail%</a></p>
	<p class="account" if={ I.twitter } title={ 'Twitter ID: ' + I.twitter.user_id }>%i18n:common.tags.mk-twitter-setting.connected-to%: <a href={ 'https://twitter.com/' + I.twitter.screen_name } target="_blank">@{ I.twitter.screen_name }</a></p>
	<p>
		<a href={ CONFIG.apiUrl + '/connect/twitter' } target="_blank" onclick={ authorize }>{ I.twitter ? '%i18n:common.tags.mk-twitter-setting.reconnect%' : '%i18n:common.tags.mk-twitter-setting.connect%' }</a>
		<span if={ I.twitter }> or </span>
		<a href={ CONFIG.apiUrl + '/disconnect/twitter' } target="_blank" if={ I.twitter }>%i18n:common.tags.mk-twitter-setting.disconnect%</a>
	</p>
	<p class="id" if={ I.twitter }>Twitter ID: { I.twitter.user_id }</p>
	<style>
		:scope
			display block
			color #4a535a

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
		this.mixin('i');

		this.form = null;

		this.on('mount', () => {
			this.I.on('updated', this.onMeUpdated);
		});

		this.on('mount', () => {
			this.I.off('updated', this.onMeUpdated);
		});

		this.onMeUpdated = () => {
			if (this.I.twitter) {
				if (this.form) this.form.close();
			}
		};

		this.authorize = () => {
			this.form = window.open(CONFIG.apiUrl + '/connect/twitter',
				'twitter_authorize_window',
				'height=570,width=520');
			return false;
		};
	</script>
</mk-twitter-setting>
