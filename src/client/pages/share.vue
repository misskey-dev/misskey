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
				:initial-local-only="localOnly"
				:reply="reply"
				:renote="renote"
				:visible-users="visibleUsers"
				@posted="state = 'posted'"
				class="_panel"
			/>
			<MkButton v-else-if="state === 'posted'" primary @click="close()">{{ $ts.close }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
// SPECIFICATION: https://wiki.misskey.io/ja/advanced-functions/share

import { defineComponent } from 'vue';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@client/components/ui/button.vue';
import XPostForm from '@client/components/post-form.vue';
import * as os from '@client/os';
import { noteVisibilities } from '@/types';
import parseAcct from '@/misc/acct/parse';

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
			visibility: null as string | null,
			localOnly: null as boolean | null,
			files: null as any[] | null,
			visibleUsers: [] as any[],

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
		// Googleニュース対策
		if (text?.startsWith(`${this.title}.\n`)) noteText += text.replace(`${this.title}.\n`, '');
		else if (text && this.title !== text) noteText += `${text}\n`;
		if (url) noteText += `${url}`;
		this.initialText = noteText.trim();

		const visibility = urlParams.get('visibility');
		if (noteVisibilities.includes(visibility)) {
			this.visibility = visibility;
		}

		if (this.visibility === 'specified') {
			const visibleUserIds = urlParams.get('visibleUserIds');
			const visibleAccts = urlParams.get('visibleAccts');
			this.visibleUsers = await [
				...(visibleUserIds ? visibleUserIds.split(',').map(userId => ({ userId })) : []),
				...(visibleAccts ? visibleAccts.split(',').map(parseAcct) : [])
			].map(q => os.api('users/show', q)
				.catch(() => Error(`invalid user query: ${JSON.stringify(q)}`)));
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
			const renoteId = urlParams.get('renoteId');
			const renoteUri = urlParams.get('renoteUri');
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
			const fileIds = urlParams.get('fileIds');
			if (fileIds) {
				const promises = Promise.all(fileIds.split(',')
					.map(fileId => os.api('drive/files/show', { fileId }).catch(() => Error(`invalid fileId: ${fileId}`))));
				await promises.then(files => this.files = files);
			}
		})(),]).catch(e => os.dialog({
			type: 'error',
			title: e.message,
			text: e.name
		}));

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
