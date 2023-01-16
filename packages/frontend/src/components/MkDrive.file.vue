<template>
<div
	class="ncvczrfv"
	:class="{ isSelected }"
	draggable="true"
	:title="title"
	@click="onClick"
	@contextmenu.stop="onContextmenu"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<div v-if="$i?.avatarId == file.id" class="label">
		<img src="/client-assets/label.svg"/>
		<p>{{ i18n.ts.avatar }}</p>
	</div>
	<div v-if="$i?.bannerId == file.id" class="label">
		<img src="/client-assets/label.svg"/>
		<p>{{ i18n.ts.banner }}</p>
	</div>
	<div v-if="file.isSensitive" class="label red">
		<img src="/client-assets/label-red.svg"/>
		<p>{{ i18n.ts.nsfw }}</p>
	</div>

	<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>

	<p class="name">
		<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
		<span v-if="file.name.lastIndexOf('.') != -1" class="ext">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	file: Misskey.entities.DriveFile;
	isSelected?: boolean;
	selectMode?: boolean;
}>(), {
	isSelected: false,
	selectMode: false,
});

const emit = defineEmits<{
	(ev: 'chosen', r: Misskey.entities.DriveFile): void;
	(ev: 'dragstart'): void;
	(ev: 'dragend'): void;
}>();

const isDragging = ref(false);

const title = computed(() => `${props.file.name}\n${props.file.type} ${bytes(props.file.size)}`);

function getMenu() {
	return [{
		text: i18n.ts.rename,
		icon: 'ti ti-forms',
		action: rename,
	}, {
		text: props.file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: props.file.isSensitive ? 'ti ti-eye' : 'ti ti-eye-off',
		action: toggleSensitive,
	}, {
		text: i18n.ts.describeFile,
		icon: 'ti ti-text-caption',
		action: describe,
	}, null, {
		text: i18n.ts.copyUrl,
		icon: 'ti ti-link',
		action: copyUrl,
	}, {
		type: 'a',
		href: props.file.url,
		target: '_blank',
		text: i18n.ts.download,
		icon: 'ti ti-download',
		download: props.file.name,
	}, null, {
		text: i18n.ts.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: deleteFile,
	}];
}

function onClick(ev: MouseEvent) {
	if (props.selectMode) {
		emit('chosen', props.file);
	} else {
		os.popupMenu(getMenu(), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
	}
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

function onDragstart(ev: DragEvent) {
	if (ev.dataTransfer) {
		ev.dataTransfer.effectAllowed = 'move';
		ev.dataTransfer.setData(_DATA_TRANSFER_DRIVE_FILE_, JSON.stringify(props.file));
	}
	isDragging.value = true;

	emit('dragstart');
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}

function rename() {
	os.inputText({
		title: i18n.ts.renameFile,
		placeholder: i18n.ts.inputNewFileName,
		default: props.file.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api('drive/files/update', {
			fileId: props.file.id,
			name: name,
		});
	});
}

function describe() {
	os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: props.file.comment != null ? props.file.comment : '',
		file: props.file,
	}, {
		done: caption => {
			os.api('drive/files/update', {
				fileId: props.file.id,
				comment: caption.length === 0 ? null : caption,
			});
		},
	}, 'closed');
}

function toggleSensitive() {
	os.api('drive/files/update', {
		fileId: props.file.id,
		isSensitive: !props.file.isSensitive,
	});
}

function copyUrl() {
	copyToClipboard(props.file.url);
	os.success();
}
/*
function addApp() {
	alert('not implemented yet');
}
*/
async function deleteFile() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('driveFileDeleteConfirm', { name: props.file.name }),
	});

	if (canceled) return;
	os.api('drive/files/delete', {
		fileId: props.file.id,
	});
}
</script>

<style lang="scss" scoped>
.ncvczrfv {
	position: relative;
	padding: 8px 0 0 0;
	min-height: 180px;
	border-radius: 8px;

	&, * {
		cursor: pointer;
	}

	> * {
		pointer-events: none;
	}

	&:hover {
		background: rgba(#000, 0.05);

		> .label {
			&:before,
			&:after {
				background: #0b65a5;
			}

			&.red {
				&:before,
				&:after {
					background: #c12113;
				}
			}
		}
	}

	&:active {
		background: rgba(#000, 0.1);

		> .label {
			&:before,
			&:after {
				background: #0b588c;
			}

			&.red {
				&:before,
				&:after {
					background: #ce2212;
				}
			}
		}
	}

	&.isSelected {
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
		}

		> .label {
			&:before,
			&:after {
				display: none;
			}
		}

		> .name {
			color: #fff;
		}

		> .thumbnail {
			color: #fff;
		}
	}

	> .label {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;

		&:before,
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1;
			background: #0c7ac9;
		}

		&:before {
			top: 0;
			left: 57px;
			width: 28px;
			height: 8px;
		}

		&:after {
			top: 57px;
			left: 0;
			width: 8px;
			height: 28px;
		}

		&.red {
			&:before,
			&:after {
				background: #c12113;
			}
		}

		> img {
			position: absolute;
			z-index: 2;
			top: 0;
			left: 0;
		}

		> p {
			position: absolute;
			z-index: 3;
			top: 19px;
			left: -28px;
			width: 120px;
			margin: 0;
			text-align: center;
			line-height: 28px;
			color: #fff;
			transform: rotate(-45deg);
		}
	}

	> .thumbnail {
		width: 110px;
		height: 110px;
		margin: auto;
	}

	> .name {
		display: block;
		margin: 4px 0 0 0;
		font-size: 0.8em;
		text-align: center;
		word-break: break-all;
		color: var(--fg);
		overflow: hidden;

		> .ext {
			opacity: 0.5;
		}
	}
}
</style>
