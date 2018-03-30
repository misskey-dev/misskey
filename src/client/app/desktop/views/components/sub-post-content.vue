<template>
<div class="mk-sub-post-content">
	<div class="body">
		<a class="reply" v-if="post.replyId">%fa:reply%</a>
		<mk-post-html :ast="post.ast" :i="os.i"/>
		<a class="rp" v-if="post.repostId" :href="`/post:${post.repostId}`">RP: ...</a>
	</div>
	<details v-if="post.media">
		<summary>({{ post.media.length }}つのメディア)</summary>
		<mk-media-list :media-list="post.media"/>
	</details>
	<details v-if="post.poll">
		<summary>投票</summary>
		<mk-poll :post="post"/>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['post']
});
</script>

<style lang="stylus" scoped>
.mk-sub-post-content
	overflow-wrap break-word

	> .body
		> .reply
			margin-right 6px
			color #717171

		> .rp
			margin-left 4px
			font-style oblique
			color #a0bf46

	mk-poll
		font-size 80%

</style>
