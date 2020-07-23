<template>
<div class="skeikyzd" v-show="files.length != 0">
	<x-draggable class="files" :list="files" animation="150" delay="100" delayOnTouchOnly="true">
		<div v-for="file in files" :key="file.id" @click="showFileMenu(file, $event)" @contextmenu.prevent="showFileMenu(file, $event)">
			<x-file-thumbnail :data-id="file.id" class="thumbnail" :file="file" fit="cover"/>
			<div class="sensitive" v-if="file.isSensitive">
				<fa class="icon" :icon="faExclamationTriangle"/>
			</div>
		</div>
	</x-draggable>
	<p class="remain">{{ 4 - files.length }}/4</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as XDraggable from 'vuedraggable';
import { faTimesCircle, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle, faICursor } from '@fortawesome/free-solid-svg-icons';
import XFileThumbnail from './drive-file-thumbnail.vue'

export default defineComponent({
	components: {
		XDraggable,
		XFileThumbnail
	},

	props: {
		files: {
			type: Array,
			required: true
		},
		detachMediaFn: {
			type: Function,
			required: false
		}
	},

	data() {
		return {
			menu: null as Promise<null> | null,

			faExclamationTriangle
		};
	},

	methods: {
		detachMedia(id) {
			if (this.detachMediaFn) {
				this.detachMediaFn(id);
			} else if (this.$parent.detachMedia) {
				this.$parent.detachMedia(id);
			}
		},
		toggleSensitive(file) {
			this.$root.api('drive/files/update', {
				fileId: file.id,
				isSensitive: !file.isSensitive
			}).then(() => {
				file.isSensitive = !file.isSensitive;
				this.$parent.updateMedia(file);
			});
		},
		async rename(file) {
			const { canceled, result } = await this.$root.dialog({
				title: this.$t('enterFileName'),
				input: {
					default: file.name
				},
				allowEmpty: false
			});
			if (canceled) return;
			this.$root.api('drive/files/update', {
				fileId: file.id,
				name: result
			}).then(() => {
				file.name = result;
				this.$parent.updateMedia(file);
			});
		},
		showFileMenu(file, ev: MouseEvent) {
			if (this.menu) return;
			this.menu = this.$root.menu({
				items: [{
					text: this.$t('renameFile'),
					icon: faICursor,
					action: () => { this.rename(file) }
				}, {
					text: file.isSensitive ? this.$t('unmarkAsSensitive') : this.$t('markAsSensitive'),
					icon: file.isSensitive ? faEyeSlash : faEye,
					action: () => { this.toggleSensitive(file) }
				}, {
					text: this.$t('attachCancel'),
					icon: faTimesCircle,
					action: () => { this.detachMedia(file.id) }
				}],
				source: ev.currentTarget || ev.target
			}).then(() => this.menu = null);
		}
	}
});
</script>

<style lang="scss" scoped>
.skeikyzd {
	padding: 4px;
	position: relative;

	> .files {
		display: flex;
		flex-wrap: wrap;

		> div {
			position: relative;
			width: 64px;
			height: 64px;
			margin: 4px;
			cursor: move;

			&:hover > .remove {
				display: block;
			}

			> .thumbnail {
				width: 100%;
				height: 100%;
				z-index: 1;
				color: var(--fg);
			}

			> .sensitive {
				display: flex;
				position: absolute;
				width: 64px;
				height: 64px;
				top: 0;
				left: 0;
				z-index: 2;
				background: rgba(17, 17, 17, .7);
				color: #fff;

				> .icon {
					margin: auto;
				}
			}
		}
	}

	> .remain {
		display: block;
		position: absolute;
		top: 8px;
		right: 8px;
		margin: 0;
		padding: 0;
	}
}
</style>
