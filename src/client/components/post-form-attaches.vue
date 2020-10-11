<template>
<div class="skeikyzd" v-show="files.length != 0">
	<XDraggable class="files" :list="files" animation="150" delay="100" delay-on-touch-only="true">
		<div v-for="file in files" :key="file.id" @click="showFileMenu(file, $event)" @contextmenu.prevent="showFileMenu(file, $event)">
			<MkDriveFileThumbnail :data-id="file.id" class="thumbnail" :file="file" fit="cover"/>
			<div class="sensitive" v-if="file.isSensitive">
				<Fa class="icon" :icon="faExclamationTriangle"/>
			</div>
		</div>
	</XDraggable>
	<p class="remain">{{ 4 - files.length }}/4</p>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faTimesCircle, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle, faICursor } from '@fortawesome/free-solid-svg-icons';
import MkDriveFileThumbnail from './drive-file-thumbnail.vue'
import * as os from '@/os';

export default defineComponent({
	components: {
		XDraggable: defineAsyncComponent(() => import('vue-draggable-next').then(x => x.VueDraggableNext)),
		MkDriveFileThumbnail
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

	emits: ['updated', 'detach'],

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
			} else {
				this.$emit('detach', id);
			}
		},
		toggleSensitive(file) {
			os.api('drive/files/update', {
				fileId: file.id,
				isSensitive: !file.isSensitive
			}).then(() => {
				file.isSensitive = !file.isSensitive;
				this.$emit('updated', file);
			});
		},
		async rename(file) {
			const { canceled, result } = await os.dialog({
				title: this.$t('enterFileName'),
				input: {
					default: file.name
				},
				allowEmpty: false
			});
			if (canceled) return;
			os.api('drive/files/update', {
				fileId: file.id,
				name: result
			}).then(() => {
				file.name = result;
				this.$emit('updated', file);
			});
		},
		showFileMenu(file, ev: MouseEvent) {
			if (this.menu) return;
			this.menu = os.menu({
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
			}, {
				source: ev.currentTarget || ev.target,
			}).then(() => this.menu = null);
		}
	}
});
</script>

<style lang="scss" scoped>
.skeikyzd {
	padding: 8px 16px;
	position: relative;

	> .files {
		display: flex;
		flex-wrap: wrap;

		> div {
			position: relative;
			width: 64px;
			height: 64px;
			margin-right: 4px;
			border-radius: 4px;
			overflow: hidden;
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
