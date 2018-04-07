<mk-channel>
	<mk-header/>
	<hr>
	<main v-if="!fetching">
		<h1>{ channel.title }</h1>

		<div v-if="$root.$data.os.isSignedIn">
			<p v-if="channel.isWatching">このチャンネルをウォッチしています <a @click="unwatch">ウォッチ解除</a></p>
			<p v-if="!channel.isWatching"><a @click="watch">このチャンネルをウォッチする</a></p>
		</div>

		<div class="share">
			<mk-twitter-button/>
			<mk-line-button/>
		</div>

		<div class="body">
			<p v-if="notesFetching">読み込み中<mk-ellipsis/></p>
			<div v-if="!notesFetching">
				<p v-if="notes == null || notes.length == 0">まだ投稿がありません</p>
				<template v-if="notes != null">
					<mk-channel-note each={ note in notes.slice().reverse() } note={ note } form={ parent.refs.form }/>
				</template>
			</div>
		</div>
		<hr>
		<mk-channel-form v-if="$root.$data.os.isSignedIn" channel={ channel } ref="form"/>
		<div v-if="!$root.$data.os.isSignedIn">
			<p>参加するには<a href={ _URL_ }>ログインまたは新規登録</a>してください</p>
		</div>
		<hr>
		<footer>
			<small><a href={ _URL_ }>Misskey</a> ver { _VERSION_ } (葵 aoi)</small>
		</footer>
	</main>
	<style lang="stylus" scoped>
		:scope
			display block

			> main
				> h1
					font-size 1.5em
					color #f00

				> .share
					> *
						margin-right 4px

				> .body
					margin 8px 0 0 0

				> mk-channel-form
					max-width 500px

	</style>
	<script lang="typescript">
		import Progress from '../../common/scripts/loading';
		import ChannelStream from '../../common/scripts/streaming/channel-stream';

		this.mixin('i');
		this.mixin('api');

		this.id = this.opts.id;
		this.fetching = true;
		this.notesFetching = true;
		this.channel = null;
		this.notes = null;
		this.connection = new ChannelStream(this.id);
		this.unreadCount = 0;

		this.on('mount', () => {
			document.documentElement.style.background = '#efefef';

			Progress.start();

			let fetched = false;

			// チャンネル概要読み込み
			this.$root.$data.os.api('channels/show', {
				channelId: this.id
			}).then(channel => {
				if (fetched) {
					Progress.done();
				} else {
					Progress.set(0.5);
					fetched = true;
				}

				this.update({
					fetching: false,
					channel: channel
				});

				document.title = channel.title + ' | Misskey'
			});

			// 投稿読み込み
			this.$root.$data.os.api('channels/notes', {
				channelId: this.id
			}).then(notes => {
				if (fetched) {
					Progress.done();
				} else {
					Progress.set(0.5);
					fetched = true;
				}

				this.update({
					notesFetching: false,
					notes: notes
				});
			});

			this.connection.on('note', this.onNote);
			document.addEventListener('visibilitychange', this.onVisibilitychange, false);
		});

		this.on('unmount', () => {
			this.connection.off('note', this.onNote);
			this.connection.close();
			document.removeEventListener('visibilitychange', this.onVisibilitychange);
		});

		this.onNote = note => {
			this.notes.unshift(note);
			this.update();

			if (document.hidden && this.$root.$data.os.isSignedIn && note.userId !== this.$root.$data.os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${this.channel.title} | Misskey`;
			}
		};

		this.onVisibilitychange = () => {
			if (!document.hidden) {
				this.unreadCount = 0;
				document.title = this.channel.title + ' | Misskey'
			}
		};

		this.watch = () => {
			this.$root.$data.os.api('channels/watch', {
				channelId: this.id
			}).then(() => {
				this.channel.isWatching = true;
				this.update();
			}, e => {
				alert('error');
			});
		};

		this.unwatch = () => {
			this.$root.$data.os.api('channels/unwatch', {
				channelId: this.id
			}).then(() => {
				this.channel.isWatching = false;
				this.update();
			}, e => {
				alert('error');
			});
		};
	</script>
</mk-channel>

<mk-channel-note>
	<header>
		<a class="index" @click="reply">{ note.index }:</a>
		<a class="name" href={ _URL_ + '/@' + acct }><b>{ getUserName(note.user) }</b></a>
		<mk-time time={ note.createdAt }/>
		<mk-time time={ note.createdAt } mode="detail"/>
		<span>ID:<i>{ acct }</i></span>
	</header>
	<div>
		<a v-if="note.reply">&gt;&gt;{ note.reply.index }</a>
		{ note.text }
		<div class="media" v-if="note.media">
			<template each={ file in note.media }>
				<a href={ file.url } target="_blank">
					<img src={ file.url + '?thumbnail&size=512' } alt={ file.name } title={ file.name }/>
				</a>
			</template>
		</div>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 0

			> header
				position -webkit-sticky
				position sticky
				z-index 1
				top 0
				background rgba(239, 239, 239, 0.9)

				> .index
					margin-right 0.25em
					color #000

				> .name
					margin-right 0.5em
					color #008000

				> mk-time
					margin-right 0.5em

					&:first-of-type
						display none

				@media (max-width 600px)
					> mk-time
						&:first-of-type
							display initial

						&:last-of-type
							display none

			> div
				padding 0 0 1em 2em

				> .media
					> a
						display inline-block

						> img
							max-width 100%
							vertical-align bottom

	</style>
	<script lang="typescript">
		import getAcct from '../../../../acct/render';
		import getUserName from '../../../../renderers/get-user-name';

		this.note = this.opts.note;
		this.form = this.opts.form;
		this.acct = getAcct(this.note.user);
		this.name = getUserName(this.note.user);

		this.reply = () => {
			this.form.update({
				reply: this.note
			});
		};
	</script>
</mk-channel-note>

<mk-channel-form>
	<p v-if="reply"><b>&gt;&gt;{ reply.index }</b> ({ getUserName(reply.user) }): <a @click="clearReply">[x]</a></p>
	<textarea ref="text" disabled={ wait } oninput={ update } onkeydown={ onkeydown } onpaste={ onpaste } placeholder="%i18n:ch.tags.mk-channel-form.textarea%"></textarea>
	<div class="actions">
		<button @click="selectFile">%fa:upload%%i18n:ch.tags.mk-channel-form.upload%</button>
		<button @click="drive">%fa:cloud%%i18n:ch.tags.mk-channel-form.drive%</button>
		<button :class="{ wait: wait }" ref="submit" disabled={ wait || (refs.text.value.length == 0) } @click="note">
			<template v-if="!wait">%fa:paper-plane%</template>{ wait ? '%i18n:ch.tags.mk-channel-form.posting%' : '%i18n:ch.tags.mk-channel-form.note%' }<mk-ellipsis v-if="wait"/>
		</button>
	</div>
	<mk-uploader ref="uploader"/>
	<ol v-if="files">
		<li each={ files }>{ name }</li>
	</ol>
	<input ref="file" type="file" accept="image/*" multiple="multiple" onchange={ changeFile }/>
	<style lang="stylus" scoped>
		:scope
			display block

			> textarea
				width 100%
				max-width 100%
				min-width 100%
				min-height 5em

			> .actions
				display flex

				> button
					> [data-fa]
						margin-right 0.25em

					&:last-child
						margin-left auto

					&.wait
						cursor wait

			> input[type='file']
				display none

	</style>
	<script lang="typescript">
		import getUserName from '../../../../renderers/get-user-name';

		this.mixin('api');

		this.channel = this.opts.channel;
		this.files = null;

		this.on('mount', () => {
			this.$refs.uploader.on('uploaded', file => {
				this.update({
					files: [file]
				});
			});
		});

		this.upload = file => {
			this.$refs.uploader.upload(file);
		};

		this.clearReply = () => {
			this.update({
				reply: null
			});
		};

		this.clear = () => {
			this.clearReply();
			this.update({
				files: null
			});
			this.$refs.text.value = '';
		};

		this.note = () => {
			this.update({
				wait: true
			});

			const files = this.files && this.files.length > 0
				? this.files.map(f => f.id)
				: undefined;

			this.$root.$data.os.api('notes/create', {
				text: this.$refs.text.value == '' ? undefined : this.$refs.text.value,
				mediaIds: files,
				replyId: this.reply ? this.reply.id : undefined,
				channelId: this.channel.id
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

		this.changeFile = () => {
			Array.from(this.$refs.file.files).forEach(this.upload);
		};

		this.selectFile = () => {
			this.$refs.file.click();
		};

		this.drive = () => {
			window['cb'] = files => {
				this.update({
					files: files
				});
			};

			window.open(_URL_ + '/selectdrive?multiple=true',
				'drive_window',
				'height=500,width=800');
		};

		this.onkeydown = e => {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
		};

		this.onpaste = e => {
			Array.from(e.clipboardData.items).forEach(item => {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			});
		};

		this.getUserName = getUserName;
	</script>
</mk-channel-form>

<mk-twitter-button>
	<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-show-count="false">Tweet</a>
	<script lang="typescript">
		this.on('mount', () => {
			const head = document.getElementsByTagName('head')[0];
			const script = document.createElement('script');
			script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
			script.setAttribute('async', 'async');
			head.appendChild(script);
		});
	</script>
</mk-twitter-button>

<mk-line-button>
	<div class="line-it-button" data-lang="ja" data-type="share-a" data-url={ _CH_URL_ } style="display: none;"></div>
	<script lang="typescript">
		this.on('mount', () => {
			const head = document.getElementsByTagName('head')[0];
			const script = document.createElement('script');
			script.setAttribute('src', 'https://d.line-scdn.net/r/web/social-plugin/js/thirdparty/loader.min.js');
			script.setAttribute('async', 'async');
			head.appendChild(script);
		});
	</script>
</mk-line-button>
