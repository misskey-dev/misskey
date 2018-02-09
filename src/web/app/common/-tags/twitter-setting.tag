<mk-twitter-setting>
	<p>%i18n:common.tags.mk-twitter-setting.description%<a href={ _DOCS_URL_ + '/link-to-twitter' } target="_blank">%i18n:common.tags.mk-twitter-setting.detail%</a></p>
	<p class="account" v-if="I.twitter" title={ 'Twitter ID: ' + I.twitter.user_id }>%i18n:common.tags.mk-twitter-setting.connected-to%: <a href={ 'https://twitter.com/' + I.twitter.screen_name } target="_blank">@{ I.twitter.screen_name }</a></p>
	<p>
		<a href={ _API_URL_ + '/connect/twitter' } target="_blank" @click="connect">{ I.twitter ? '%i18n:common.tags.mk-twitter-setting.reconnect%' : '%i18n:common.tags.mk-twitter-setting.connect%' }</a>
		<span v-if="I.twitter"> or </span>
		<a href={ _API_URL_ + '/disconnect/twitter' } target="_blank" v-if="I.twitter" @click="disconnect">%i18n:common.tags.mk-twitter-setting.disconnect%</a>
	</p>
	<p class="id" v-if="I.twitter">Twitter ID: { I.twitter.user_id }</p>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
		this.mixin('i');

		this.form = null;

		this.on('mount', () => {
			this.I.on('updated', this.onMeUpdated);
		});

		this.on('unmount', () => {
			this.I.off('updated', this.onMeUpdated);
		});

		this.onMeUpdated = () => {
			if (this.I.twitter) {
				if (this.form) this.form.close();
			}
		};

		this.connect = e => {
			e.preventDefault();
			this.form = window.open(_API_URL_ + '/connect/twitter',
				'twitter_connect_window',
				'height=570,width=520');
			return false;
		};

		this.disconnect = e => {
			e.preventDefault();
			window.open(_API_URL_ + '/disconnect/twitter',
				'twitter_disconnect_window',
				'height=570,width=520');
			return false;
		};
	</script>
</mk-twitter-setting>
