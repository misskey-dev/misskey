<template>
<div class="ngbfujlo">
	<mk-textarea :value="text" readonly style="margin: 0;"></mk-textarea>
	<mk-button class="button" primary @click="post()" :disabled="posting || posted"><fa v-if="posted" :icon="faCheck"/><fa v-else :icon="faPaperPlane"/></mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCheck, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import MkTextarea from '../ui/textarea.vue';
import MkButton from '../ui/button.vue';
import { apiUrl } from '../../config';

export default Vue.extend({
	i18n,
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
			return new Promise((ok) => {
				const dialog = this.$root.dialog({
					type: 'waiting',
					text: this.$t('uploading') + '...',
					showOkButton: false,
					showCancelButton: false,
					cancelableByBgClick: false
				});
				const canvas = this.hpml.canvases[this.value.canvasId];
				canvas.toBlob(blob => {
					const data = new FormData();
					data.append('file', blob);
					data.append('i', this.$store.state.i.token);
					if (this.$store.state.settings.uploadFolder) {
						data.append('folderId', this.$store.state.settings.uploadFolder);
					}

					fetch(apiUrl + '/drive/files/create', {
						method: 'POST',
						body: data
					})
					.then(response => response.json())
					.then(f => {
						dialog.close();
						ok(f);
					})
				});
			});
		},
		async post() {
			this.posting = true;
			const file = this.value.attachCanvasImage ? await this.upload() : null;
			this.$root.api('notes/create', {
				text: this.text === '' ? null : this.text,
				fileIds: file ? [file.id] : undefined,
			}).then(() => {
				this.posted = true;
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
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
