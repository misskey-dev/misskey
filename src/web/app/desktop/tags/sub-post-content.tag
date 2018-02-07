<mk-sub-post-content>
	<div class="body">
		<a class="reply" if={ post.reply_id }>
			%fa:reply%
		</a>
		<span ref="text"></span>
		<a class="quote" if={ post.repost_id } href={ '/post:' + post.repost_id }>RP: ...</a>
	</div>
	<details if={ post.media }>
		<summary>({ post.media.length }つのメディア)</summary>
		<mk-images images={ post.media }/>
	</details>
	<details if={ post.poll }>
		<summary>投票</summary>
		<mk-poll post={ post }/>
	</details>
	<style lang="stylus" scoped>
		:scope
			display block
			overflow-wrap break-word

			> .body
				> .reply
					margin-right 6px
					color #717171

				> .quote
					margin-left 4px
					font-style oblique
					color #a0bf46

			mk-poll
				font-size 80%

	</style>
	<script>
		import compile from '../../common/scripts/text-compiler';

		this.mixin('user-preview');

		this.post = this.opts.post;

		this.on('mount', () => {
			if (this.post.text) {
				const tokens = this.post.ast;
				this.$refs.text.innerHTML = compile(tokens, false);

				Array.from(this.$refs.text.children).forEach(e => {
					if (e.tagName == 'MK-URL') riot.mount(e);
				});
			}
		});
	</script>
</mk-sub-post-content>
