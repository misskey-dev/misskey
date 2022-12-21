<template>
<div v-show="props.modelValue.length != 0" class="skeikyzd">
	<Sortable :list="props.modelValue" class="files" item-key="id" :options="{ animation: 150, delay: 100, delayOnTouchOnly: true }" @end="onSorted">
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
import { deepClone } from '@/scripts/clone';
import { i18n } from '@/i18n';

const Sortable = defineAsyncComponent(() => import('sortablejs-vue3').then(x => x.Sortable));

const props = defineProps<{
	modelValue: any[];
	detachMediaFn: () => void;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any[]): void;
	(ev: 'detach'): void;
	(ev: 'changeSensitive'): void;
	(ev: 'changeName'): void;
}>();

let menuShowing = false;

function onSorted(event) {
	const items = deepClone(props.modelValue);
	const item = items.splice(event.oldIndex, 1)[0];
	items.splice(event.newIndex, 0, item);
	emit('update:modelValue', items);
}

function detachMedia(id) {
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
	os.popup(defineAsyncComponent(() => import('@/components/MkMediaCaption.vue')), {
		title: i18n.ts.describeFile,
		input: {
			placeholder: i18n.ts.inputNewDescription,
			default: file.comment !== null ? file.comment : '',
		},
		image: file,
	}, {
		done: result => {
			if (!result || result.canceled) return;
			let comment = result.result.length === 0 ? null : result.result;
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
		icon: 'ti ti-forms',
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
