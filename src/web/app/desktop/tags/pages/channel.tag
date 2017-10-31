<mk-channel-page>
	<mk-ui ref="ui">
		<main if={ !parent.fetching }>
			<h1>{ parent.channel.title }</h1>
			<mk-channel-post if={ parent.posts } each={ parent.posts.reverse() } post={ this } form={ parent.refs.form }/>
			<hr>
			<mk-channel-form channel={ parent.channel } ref="form"/>
		</main>
	</mk-ui>
	<style>
		:scope
			display block

			main
				padding 8px

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
		<a class="index" onclick={ reply }>{ post.index }:</a>
		<a class="name" href={ '/' + post.user.username }><b>{ post.user.name }</b></a>
		<mk-time time={ post.created_at } mode="detail"/>
		<span>ID:<i>{ post.user.username }</i></span>
	</header>
	<div>
		<a if={ post.reply_to }>&gt;&gt;{ post.reply_to.index }</a>
		{ post.text }
	</div>
	<style>
		:scope
			display block
			margin 0
			padding 0

			> header
				> .index
					margin-right 0.25em
					color #000

				> .name
					margin-right 0.5em
					color #008000

				> mk-time
					margin-right 0.5em

			> div
				padding 0 0 1em 2em

	</style>
	<script>
		this.post = this.opts.post;
		this.form = this.opts.form;

		this.reply = () => {
			this.form.update({
				reply: this.post
			});
		};
	</script>
</mk-channel-post>

<mk-channel-form>
	<p if={ reply }><b>&gt;&gt;{ reply.index }</b> ({ reply.user.name }): <a onclick={ clearReply }>[x]</a></p>
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
