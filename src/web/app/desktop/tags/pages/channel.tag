<mk-channel-page>
	<mk-ui ref="ui">
		<main if={ !parent.fetching }>
			<h1>{ parent.channel.title }</h1>
			<mk-channel-post each={ parent.posts } post={ this }/>
			<mk-channel-form channel={ parent.channel }/>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

			main
				> h1
					color #f00
	</style>
	<script>
		import Progress from '../../../common/scripts/loading';
		import ChannelStream from '../../../common/scripts/channel-stream';

		this.mixin('api');

		this.id = this.opts.id;
		this.fetching = true;
		this.channel = null;
		this.posts = null;
		this.connection = new ChannelStream();

		this.on('mount', () => {
			document.documentElement.style.background = '#efefef';

			Progress.start();

			this.api('channels/show', {
				channel_id: this.id
			}).then(channel => {
				Progress.done();

				this.update({
					fetching: false,
					channel: channel
				});

				document.title = channel.title + ' | Misskey'
			});

			this.api('channels/posts', {
				channel_id: this.id
			}).then(posts => {
				this.update({
					posts: posts
				});
			});
		});
	</script>
</mk-channel-page>

<mk-channel-post>
	<header>
		<b>{ post.user.name }</b>
	</header>
	<div>
		{ post.text }
	</div>
	<style>
		:scope
			display block
			margin 0
			padding 0

			> header
				> b
					color #008000

	</style>
	<script>
		this.post = this.opts.post;
	</script>
</mk-channel-post>

<mk-channel-form>
	<p if={ reply }>{ reply.user.name }への返信: (or <a onclick={ clearReply }>キャンセル</a>)</p>
	<textarea ref="text" disabled={ wait }></textarea>
	<button class={ wait: wait } ref="submit" disabled={ wait || (refs.text.value.length == 0) } onclick={ post }>
		{ wait ? 'やってます' : 'やる' }<mk-ellipsis if={ wait }/>
	</button>

	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.channel = this.opts.channel;

		this.clearReply = () => {
			this.update({
				reply: null
			});
		};

		this.clear = () => {
			this.clearReply();
			this.refs.text.value = '';
		};

		this.post = e => {
			this.update({
				wait: true
			});

			this.api('posts/create', {
				text: this.refs.text.value,
				reply_to_id: this.reply ? this.reply.id : undefined,
				channel_id: this.channel.id
			}).then(data => {
				this.clear();
			}).catch(err => {
				alert('失敗した');
			}).then(() => {
				this.update({
					wait: false
				});
			});
		};

	</script>
</mk-channel-form>
