<template>
<div class="mk-sub-post-content">
	<div class="body">
		<a class="reply" v-if="post.reply_id">%fa:reply%</a>
		<span ref="text"></span>
		<a class="quote" v-if="post.repost_id" :href="`/post:${post.repost_id}`">RP: ...</a>
	</div>
	<details v-if="post.media">
		<summary>({{ post.media.length }}つのメディア)</summary>
		<mk-images :images="post.media"/>
	</details>
	<details v-if="post.poll">
		<summary>投票</summary>
		<mk-poll :post="post"/>
	</details>
</div>
</template>

<script lang="typescript">
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

<style lang="stylus" scoped>
.mk-sub-post-content
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
