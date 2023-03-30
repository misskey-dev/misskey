<template>
<div v-show="props.modelValue.length != 0" class="skeikyzd">
	<Sortable :model-value="props.modelValue" class="files" item-key="id" :animation="150" :delay="100" :delay-on-touch-only="true" @update:model-value="v => emit('update:modelValue', v)">
		<template #item="{element}">
			<div class="file" @click="showFileMenu(element, $event)" @contextmenu.prevent="showFileMenu(element, $event)">
				<MkDriveFileThumbnail :data-id="element.id" class="thumbnail" :file="element" fit="cover"/>
				<div v-if="element.isSensitive" class="sensitive">
					<i class="ti ti-alert-triangle icon"></i>
				</div>
			</div>
		</template>
	</Sortable>
	<p class="remain">{{ 16 - props.modelValue.length }}/16</p>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	modelValue: any[];
	detachMediaFn?: (id: string) => void;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any[]): void;
	(ev: 'detach', id: string): void;
	(ev: 'changeSensitive'): void;
	(ev: 'changeName'): void;
}>();

let menuShowing = false;

function detachMedia(id: string) {
	if (props.detachMediaFn) {
		props.detachMediaFn(id);
	} else {
		emit('detach', id);
	}
}

function toggleSensitive(file) {
	os.api('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emit('changeSensitive', file, !file.isSensitive);
	});
}
async function rename(file) {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.enterFileName,
		default: file.name,
		allowEmpty: false,
	});
	if (canceled) return;
	os.api('drive/files/update', {
		fileId: file.id,
		name: result,
	}).then(() => {
		emit('changeName', file, result);
		file.name = result;
	});
}

async function describe(file) {
	os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: file.comment !== null ? file.comment : '',
		file: file,
	}, {
		done: caption => {
			let comment = caption.length === 0 ? null : caption;
			os.api('drive/files/update', {
				fileId: file.id,
				comment: comment,
			}).then(() => {
				file.comment = comment;
			});
		},
	}, 'closed');
}

function showFileMenu(file, ev: MouseEvent) {
	if (menuShowing) return;
	os.popupMenu([{
		text: i18n.ts.renameFile,
		icon: 'ti ti-forms',
		action: () => { rename(file); },
	}, {
		text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye-off' : 'ti ti-eye',
		action: () => { toggleSensitive(file); },
	}, {
		text: i18n.ts.describeFile,
		icon: 'ti ti-text-caption',
		action: () => { describe(file); },
	}, {
		text: i18n.ts.attachCancel,
		icon: 'ti ti-circle-x',
		action: () => { detachMedia(file.id); },
	}], ev.currentTarget ?? ev.target).then(() => menuShowing = false);
	menuShowing = true;
}
</script>

<style lang="scss" scoped>
.skeikyzd {
	padding: 8px 16px;
	position: relative;

	> .files {
		display: flex;
		flex-wrap: wrap;

		> .file {
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
