<template>
<div class="civpbkhh">
	<div class="scrollbox" ref="scroll" v-bind:class="{ scroll: isScrolling }">
		<div v-for="note in notes" class="note">
			<div class="content _panel">
				<div class="body">
					<MkA class="reply" v-if="note.replyId" :to="`/notes/${note.replyId}`"><i class="fas fa-reply"></i></MkA>
					<Mfm v-if="note.text" :text="note.text" :author="note.user" :i="$i" :custom-emojis="note.emojis"/>
					<MkA class="rp" v-if="note.renoteId" :to="`/notes/${note.renoteId}`">RN: ...</MkA>
				</div>
				<div v-if="note.files.length > 0" class="richcontent">
					<XMediaList :media-list="note.files"/>
				</div>
				<div v-if="note.poll">
					<XPoll :note="note" :readOnly="true" />
				</div>
			</div>
			<XReactionsViewer :note="note" ref="reactionsViewer"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XReactionsViewer from '@client/components/reactions-viewer.vue';
import XMediaList from '@client/components/media-list.vue';
import XPoll from '@client/components/poll.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XReactionsViewer,
		XMediaList,
		XPoll
	},

	data() {
		return {
			notes: [],
			isScrolling: false,
		}
	},

	created() {
		os.api('notes/featured').then(notes => {
			this.notes = notes;
		});
	},

	updated() {
		if (this.$refs.scroll.clientHeight > window.innerHeight) {
			this.isScrolling = true;
		}
	}
});
</script>

<style lang="scss" scoped>
@keyframes scroll {
	0% {
		transform: translate3d(0, 0, 0);
	}
	5% {
		transform: translate3d(0, 0, 0);
	}
	75% {
		transform: translate3d(0, calc(-100% + 90vh), 0);
	}
	90% {
		transform: translate3d(0, calc(-100% + 90vh), 0);
	}
}

.civpbkhh {
	text-align: right;

	> .scrollbox {
		&.scroll {
			animation: scroll 45s linear infinite;
		}

		> .note {
			margin: 16px 0 16px auto;

			> .content {
				padding: 16px;
				margin: 0 0 0 auto;
				max-width: max-content;
				border-radius: 16px;

				> .richcontent {
					min-width: 250px;
				}
			}
		}
	}
}
</style>
