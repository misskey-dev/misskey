<template>
<div class="ngbfujlo">
	<MkTextarea :value="text" readonly style="margin: 0;"></MkTextarea>
	<MkButton class="button" primary @click="post()" :disabled="posting || posted"><Fa v-if="posted" :icon="faCheck"/><Fa v-else :icon="faPaperPlane"/></MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import MkTextarea from '../ui/textarea.vue';
import MkButton from '../ui/button.vue';
import { apiUrl } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkTextarea,
		MkButton,
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.value.text),
			posted: false,
			posting: false,
			faCheck, faPaperPlane
		};
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.value.text);
			},
			deep: true
		}
	},
	methods: {
		upload() {
			const promise = new Promise((ok) => {
				const canvas = this.hpml.canvases[this.value.canvasId];
				canvas.toBlob(blob => {
					const data = new FormData();
					data.append('file', blob);
					data.append('i', this.$i.token);
					if (this.$store.state.settings.uploadFolder) {
						data.append('folderId', this.$store.state.settings.uploadFolder);
					}

					fetch(apiUrl + '/drive/files/create', {
						method: 'POST',
						body: data
					})
					.then(response => response.json())
					.then(f => {
						ok(f);
					})
				});
			});
			os.promiseDialog(promise);
			return promise;
		},
		async post() {
			this.posting = true;
			const file = this.value.attachCanvasImage ? await this.upload() : null;
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
