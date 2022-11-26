<template>
<div class="ngbfujlo">
	<MkTextarea :model-value="text" readonly style="margin: 0;"></MkTextarea>
	<MkButton class="button" primary :disabled="posting || posted" @click="post()">
		<i v-if="posted" class="fas fa-check"></i>
		<i v-else class="fas fa-paper-plane"></i>
	</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import MkTextarea from '../form/textarea.vue';
import MkButton from '../MkButton.vue';
import { apiUrl } from '@/config';
import * as os from '@/os';
import { PostBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

export default defineComponent({
	components: {
		MkTextarea,
		MkButton,
	},
	props: {
		block: {
			type: Object as PropType<PostBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.block.text),
			posted: false,
			posting: false,
		};
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.block.text);
			},
			deep: true
		}
	},
	methods: {
		upload() {
			const promise = new Promise((ok) => {
				const canvas = this.hpml.canvases[this.block.canvasId];
				canvas.toBlob(blob => {
					const formData = new FormData();
					formData.append('file', blob);
					formData.append('i', this.$i.token);
					if (this.$store.state.uploadFolder) {
						formData.append('folderId', this.$store.state.uploadFolder);
					}

					fetch(apiUrl + '/drive/files/create', {
						method: 'POST',
						body: formData,
					})
					.then(response => response.json())
					.then(f => {
						ok(f);
					});
				});
			});
			os.promiseDialog(promise);
			return promise;
		},
		async post() {
			this.posting = true;
			const file = this.block.attachCanvasImage ? await this.upload() : null;
			os.apiWithDialog('notes/create', {
				text: this.text === '' ? null : this.text,
				fileIds: file ? [file.id] : undefined,
			}).then(() => {
				this.posted = true;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.ngbfujlo {
	position: relative;
	padding: 32px;
	border-radius: 6px;
	box-shadow: 0 2px 8px var(--shadow);
	z-index: 1;

	> .button {
		margin-top: 32px;
	}

	@media (max-width: 600px) {
		padding: 16px;

		> .button {
			margin-top: 16px;
		}
	}
}
</style>
