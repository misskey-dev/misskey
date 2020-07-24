<template>
<div class="wrmlmaau">
	<div class="body">
		<span v-if="note.isHidden" style="opacity: 0.5">({{ $t('private') }})</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">({{ $t('deleted') }})</span>
		<router-link class="reply" v-if="note.replyId" :to="`/notes/${note.replyId}`"><fa :icon="faReply"/></router-link>
		<mfm v-if="note.text" :text="note.text" :author="note.user" :i="$store.state.i" :custom-emojis="note.emojis"/>
		<router-link class="rp" v-if="note.renoteId" :to="`/notes/${note.renoteId}`">RN: ...</router-link>
	</div>
	<details v-if="note.files.length > 0">
		<summary>({{ $t('withNFiles', { n: note.files.length }) }})</summary>
		<x-media-list :media-list="note.files"/>
	</details>
	<details v-if="note.poll">
		<summary v-t="'poll'"></summary>
		<x-poll :note="note"/>
	</details>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import XPoll from './poll.vue';
import XMediaList from './media-list.vue';

export default defineComponent({
	components: {
		XPoll,
		XMediaList,
	},
	props: {
		note: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			faReply
		};
	}
});
</script>

<style lang="scss" scoped>
.wrmlmaau {
	overflow-wrap: break-word;

	> .body {
		> .reply {
			margin-right: 6px;
			color: var(--accent);
		}

		> .rp {
			margin-left: 4px;
			font-style: oblique;
			color: var(--renote);
		}
	}
}
</style>
