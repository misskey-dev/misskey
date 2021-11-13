<template>
<div class="skeikyzd" v-show="files.length != 0">
	<XDraggable class="files" v-model="_files" item-key="id" animation="150" delay="100" delay-on-touch-only="true">
		<template #item="{element}">
			<div @click="showFileMenu(element, $event)" @contextmenu.prevent="showFileMenu(element, $event)">
				<MkDriveFileThumbnail :data-id="element.id" class="thumbnail" :file="element" fit="cover"/>
				<div class="sensitive" v-if="element.isSensitive">
					<i class="fas fa-exclamation-triangle icon"></i>
				</div>
			</div>
		</template>
	</XDraggable>
	<p class="remain">{{ 4 - files.length }}/4</p>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import MkDriveFileThumbnail from './drive-file-thumbnail.vue'
import * as os from '@/os';

export default defineComponent({
	components: {
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
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

	emits: ['updated', 'detach', 'changeSensitive', 'changeName'],

	data() {
		return {
			menu: null as Promise<null> | null,

		};
	},

	computed: {
		_files: {
			get() {
				return this.files;
			},
			set(value) {
				this.$emit('updated', value);
			}
		}
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
				this.$emit('changeSensitive', file, !file.isSensitive);
			});
		},
		async rename(file) {
			const { canceled, result } = await os.dialog({
				title: this.$ts.enterFileName,
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
				this.$emit('changeName', file, result);
				file.name = result;
			});
		},

		async describe(file) {
			os.popup(import("@/components/media-caption.vue"), {
				title: this.$ts.describeFile,
				input: {
					placeholder: this.$ts.inputNewDescription,
					default: file.comment !== null ? file.comment : "",
				},
				image: file
			}, {
				done: result => {
					if (!result || result.canceled) return;
					let comment = result.result;
					os.api('drive/files/update', {
						fileId: file.id,
						comment: comment.length == 0 ? null : comment
					});
				}
			}, 'closed');
		},

		showFileMenu(file, ev: MouseEvent) {
			if (this.menu) return;
			this.menu = os.popupMenu([{
				text: this.$ts.renameFile,
				icon: 'fas fa-i-cursor',
				action: () => { this.rename(file) }
			}, {
				text: file.isSensitive ? this.$ts.unmarkAsSensitive : this.$ts.markAsSensitive,
				icon: file.isSensitive ? 'fas fa-eye-slash' : 'fas fa-eye',
				action: () => { this.toggleSensitive(file) }
			}, {
				text: this.$ts.describeFile,
				icon: 'fas fa-i-cursor',
				action: () => { this.describe(file) }
			}, {
				text: this.$ts.attachCancel,
				icon: 'fas fa-times-circle',
				action: () => { this.detachMedia(file.id) }
			}], ev.currentTarget || ev.target).then(() => this.menu = null);
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
