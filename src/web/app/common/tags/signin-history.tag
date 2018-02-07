<mk-signin-history>
	<div class="records" v-if="history.length != 0">
		<mk-signin-record each={ rec in history } rec={ rec }/>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.history = [];
		this.fetching = true;

		this.on('mount', () => {
			this.api('i/signin_history').then(history => {
				this.update({
					fetching: false,
					history: history
				});
			});

			this.connection.on('signin', this.onSignin);
		});

		this.on('unmount', () => {
			this.connection.off('signin', this.onSignin);
			this.stream.dispose(this.connectionId);
		});

		this.onSignin = signin => {
			this.history.unshift(signin);
			this.update();
		};
	</script>
</mk-signin-history>

<mk-signin-record>
	<header @click="toggle">
		<virtual v-if="rec.success">%fa:check%</virtual>
		<virtual v-if="!rec.success">%fa:times%</virtual>
		<span class="ip">{ rec.ip }</span>
		<mk-time time={ rec.created_at }/>
	</header>
	<pre ref="headers" class="json" show={ show }>{ JSON.stringify(rec.headers, null, 2) }</pre>

	<style lang="stylus" scoped>
		:scope
			display block
			border-bottom solid 1px #eee

			> header
				display flex
				padding 8px 0
				line-height 32px
				cursor pointer

				> [data-fa]
					margin-right 8px
					text-align left

					&.check
						color #0fda82

					&.times
						color #ff3100

				> .ip
					display inline-block
					text-align left
					padding 8px
					line-height 16px
					font-family monospace
					font-size 14px
					color #444
					background #f8f8f8
					border-radius 4px

				> mk-time
					margin-left auto
					text-align right
					color #777

			> pre
				overflow auto
				margin 0 0 16px 0
				max-height 100px
				white-space pre-wrap
				word-break break-all
				color #4a535a

	</style>

	<script>
		import hljs from 'highlight.js';

		this.rec = this.opts.rec;
		this.show = false;

		this.on('mount', () => {
			hljs.highlightBlock(this.$refs.headers);
		});

		this.toggle = () => {
			this.update({
				show: !this.show
			});
		};
	</script>
</mk-signin-record>
