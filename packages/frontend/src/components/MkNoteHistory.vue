<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkAvatar :class="$style.avatar" :user="user"/>
	<div :class="$style.main">
		<div :class="$style.header">
			<MkUserName :class="$style.userName" :user="user" :nowrap="true"/>
			<MkTime :class="$style.updatedAt" :time="updatedAt" colored style="margin-left: auto"/>
		</div>
		<div>
			<p v-if="cw != null && cw != ''" :class="$style.cw">
				<Mfm :text="cw" :author="user" :nyaize="'respect'" :i="user" style="margin-right: 8px;"/>
				<MkCwButton v-model="showContent" :text="text.trim()" :files="files" :poll="poll" style="margin: 4px 0;"/>
			</p>
			<div v-show="cw == null || cw == '' || showContent">
				<Mfm :text="text.trim()" :author="user" :nyaize="'respect'" :i="user"/>
			</div>
			<div v-if="files && files.length > 0">
				<MkMediaList ref="galleryEl" :mediaList="files"/>
			</div>
		</div>
		<footer :class="$style.footer">
			<button ref="menuButton" :class="$style.footerButton" class="_button" @mousedown.prevent="showMenu()">
				<i class="ti ti-dots"></i>
			</button>
		</footer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu';
import type { PollEditorModelValue } from '@/components/MkPollEditor.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard';
import MkCwButton from '@/components/MkCwButton.vue';

const showContent = ref(false);
const menuButton = ref<HTMLButtonElement | null>(null);
const props = defineProps<{
	text: string;
	updatedAt: Date;
	files: Misskey.entities.DriveFile[];
	poll?: PollEditorModelValue;
	cw: string | null;
	user: Misskey.entities.User;
}>();

function showMenu() {
	function copyContent(): void {
		copyToClipboard(props.text);
		os.success();
	}

	const menu: MenuItem[] = [
		{
			icon: 'ti ti-copy',
			text: i18n.ts.copyContent,
			action: copyContent,
		},
	];
	os.popupMenu(menu, menuButton.value).then(focus);
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 10px;
	padding: 10px 10px 0 10px;
	overflow: clip;
	font-size: 1em;
	border-top: solid .5px var(--divider);
}

.avatar {
	flex-shrink: 0 !important;
	display: block !important;
	margin: 0 10px 0 0 !important;
	width: 40px !important;
	height: 40px !important;
	border-radius: 8px !important;
	pointer-events: none !important;
}

.main {
	flex: 1;
	min-width: 0;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.header {
	display: flex;
	margin-bottom: 2px;
	width: 100%;
	overflow: clip;
	text-overflow: ellipsis;
}

.userName {
	font-weight: bold;
}

.updatedAt {
	font-size: 0.85em;
}

@container (min-width: 350px) {
	.avatar {
		margin: 0 10px 0 0 !important;
		width: 44px !important;
		height: 44px !important;
	}
}

@container (min-width: 500px) {
	.avatar {
		margin: 0 12px 0 0 !important;
		width: 48px !important;
		height: 48px !important;
	}
}

.footer {
	display: flex;
	position: relative;
	z-index: 1;
	margin-top: 10px;
}

.footerButton {
	margin-left: auto;
}
</style>
