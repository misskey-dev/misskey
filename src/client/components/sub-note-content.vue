<template>
<div class="wrmlmaau" ref="i">
	<div class="body">
		<span v-if="note.isHidden" style="opacity: 0.5">({{ $t('private') }})</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">({{ $t('deleted') }})</span>
		<router-link class="reply" v-if="note.replyId" :to="`/notes/${note.replyId}`"><fa :icon="faReply"/></router-link>
		<mfm v-if="note.text" :text="note.text" :author="note.user" :i="$store.state.i" :custom-emojis="note.emojis"/>
		<router-link class="rp" v-if="note.renoteId" :to="`/notes/${note.renoteId}`">RN: ...</router-link>
	</div>
	<details v-if="note.files.length > 0">
		<summary>({{ $t('withNFiles', { n: note.files.length }) }})</summary>
		<x-media-list :media-list="note.files" :width="width"/>
	</details>
	<details v-if="note.poll">
		<summary>{{ $t('poll') }}</summary>
		<x-poll :note="note"/>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import XPoll from './poll.vue';
import XMediaList from './media-list.vue';

export default Vue.extend({
	i18n,
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
			width: 0,

			faReply
		};
	},
	mounted() {
		this.width = this.$refs.i.getBoundingClientRect().width
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
