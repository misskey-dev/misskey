<template>
<div class="mk-sub-note-content">
	<div class="body">
		<span v-if="note.isHidden" style="opacity: 0.5">(この投稿は非公開です)</span>
		<a class="reply" v-if="note.replyId">%fa:reply%</a>
		<mk-note-html :text="note.text" :i="os.i"/>
		<a class="rp" v-if="note.renoteId" :href="`/note:${note.renoteId}`">RP: ...</a>
	</div>
	<details v-if="note.media.length > 0">
		<summary>({{ note.media.length }}つのメディア)</summary>
		<mk-media-list :media-list="note.media"/>
	</details>
	<details v-if="note.poll">
		<summary>投票</summary>
		<mk-poll :note="note"/>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note']
});
</script>

<style lang="stylus" scoped>
.mk-sub-note-content
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
