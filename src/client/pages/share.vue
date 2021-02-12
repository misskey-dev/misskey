<template>
<div class="">
	<section class="_section">
		<div class="_title" v-if="title">{{ title }}</div>
		<div class="_content">
			<XPostForm
				v-if="state === 'writing'"
				fixed
				:share="true"
				:initial-text="initialText"
				:initial-visibility="visibility"
				:initial-files="files"
				:reply="reply"
				:renote="renote"
				:specified="specified"
				@posted="state = 'posted'"
				class="_panel"
			/>
			<MkButton v-else-if="state === 'posted'" primary @click="close()">{{ $ts.close }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import XPostForm from '@/components/post-form.vue';
import * as os from '@/os';
import { noteVisibilities } from '../../types';

export default defineComponent({
	components: {
		XPostForm,
		MkButton,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.share,
				icon: faShareAlt
			},
			state: 'fetching' as 'fetching' | 'writing' | 'posted',

			title: null as string | null,
			initialText: null as string | null,
			reply: null as any,
			renote: null as any,
			specified: null as any,
			visibility: null as string | null,
			localOnly: null as boolean | null,
			files: null as any[] | null,

			faShareAlt
		}
	},

	async created() {
		const urlParams = new URLSearchParams(window.location.search);

		this.title = urlParams.get('title');
		const text = urlParams.get('text');
		const url = urlParams.get('url');

		let noteText = '';
		if (this.title) noteText += `【${this.title}】\n`;
		// titleとtext（またはtext. Googleニュースがこれを吐く）が同一であればtextを省略
		if (text && this.title !== text && this.title !== `${text}.`) noteText += `${text}\n`;
		if (url) noteText += `${url}`;
		this.initialText = noteText.trim();

		const visibility = urlParams.get('visibility');
		if (noteVisibilities.includes(visibility)) {
			this.visibility = visibility;
		} else {
			// Mastodonと互換性を持たせてみる
			if (this.visibility === 'unlisted') this.visibility = 'home';
			else if (this.visibility === 'private') this.visibility = 'followers';
			else if (this.visibility === 'direct') this.visibility = 'specified';
			else this.visibility = null;
		}

		const localOnly = urlParams.get('localOnly');
		if (localOnly === '0') this.localOnly = false;
		else if (localOnly === '1') this.localOnly = true;

		await Promise.all([(async () => {
			const replyId = urlParams.get('replyId');
			const replyUri = urlParams.get('replyUri');
			if (replyId) {
				this.reply = await os.api('notes/show', {
					noteId: replyId
				});
			} else if (replyUri) {
				const obj = await os.api('ap/show', {
					uri: replyUri
				}) as any;
				if (obj.type === 'Note') {
					this.reply = obj.object;
				}
			}
		})(),(async () => {
			const renoteId = urlParams.get('replyId');
			const renoteUri = urlParams.get('replyUri');
			if (renoteId) {
				this.renote = await os.api('notes/show', {
					noteId: renoteId
				});
			} else if (renoteUri) {
				const obj = await os.api('ap/show', {
					uri: renoteUri
				}) as any;
				if (obj.type === 'Note') {
					this.renote = obj.object;
				}
			}
		})(),(async () => {
			const specifiedId = urlParams.get('specifiedId');
			const specifiedUsername = urlParams.get('specifiedUsername');
			if (specifiedId) {
				this.specified = await os.api('users/show', {
					userId: specifiedId
				});
			} else if (specifiedUsername) {
				this.specified = await os.api('users/show', {
					username: specifiedUsername
				});
			}
		})(),(async () => {
			const fileIds = urlParams.get('fileIds');
			if (fileIds) {
				const promises = Promise.all(fileIds.split(',').map(fileId => os.api('drive/files/show', { fileId })));
				promises.then(files => this.files = files).catch(() => console.error('invalid fileIds'));
			}
		})(),]);

		this.state = 'writing';
	},

	methods: {
		close() {
			window.close()
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
