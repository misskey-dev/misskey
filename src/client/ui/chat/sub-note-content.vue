<template>
<div class="wrmlmaau">
	<div class="body">
		<span v-if="note.isHidden" style="opacity: 0.5">({{ $ts.private }})</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">({{ $ts.deleted }})</span>
		<MkA class="reply" v-if="note.replyId" :to="`/notes/${note.replyId}`"><Fa :icon="faReply"/></MkA>
		<Mfm v-if="note.text" :text="note.text" :author="note.user" :i="$i" :custom-emojis="note.emojis"/>
		<MkA class="rp" v-if="note.renoteId" :to="`/notes/${note.renoteId}`">RN: ...</MkA>
	</div>
	<details v-if="note.files.length > 0">
		<summary>({{ $t('withNFiles', { n: note.files.length }) }})</summary>
		<XMediaList :media-list="note.files"/>
	</details>
	<details v-if="note.poll">
		<summary>{{ $ts.poll }}</summary>
		<XPoll :note="note"/>
	</details>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import XPoll from '@client/components/poll.vue';
import XMediaList from '@client/components/media-list.vue';
import * as os from '@client/os';

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
