<template>
<div :class="[$style.root, { [$style.isMe]: isMe }]">
	<MkAvatar :class="$style.avatar" :user="user" :link="!isMe" :preview="false"/>
	<div :class="$style.body">
		<MkFukidashi :class="$style.fukidashi" :tail="isMe ? 'right' : 'left'" :accented="isMe">
			<div v-if="!message.isDeleted" :class="$style.content">
				<Mfm v-if="message.text" ref="text" class="_selectable" :text="message.text" :i="$i"/>
				<MkMediaList v-if="message.file" :mediaList="[message.file]" :class="$style.file"/>
			</div>
			<div v-else :class="$style.content">
				<p>{{ i18n.ts.deleted }}</p>
			</div>
		</MkFukidashi>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" style="margin: 8px 0;"/>
		<div :class="$style.footer">
			<button class="_textButton" style="color: currentColor;" @click="showMenu"><i class="ti ti-dots-circle-horizontal"></i></button>
			<MkTime :class="$style.time" :time="message.createdAt"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import { extractUrlFromMfm } from '@/utility/extract-url-from-mfm.js';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkFukidashi from '@/components/MkFukidashi.vue';
import * as os from '@/os.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import MkMediaList from '@/components/MkMediaList.vue';

const $i = ensureSignin();

const props = defineProps<{
	message: Misskey.entities.ChatMessageLite;
	user: Misskey.entities.User;
	isRoom?: boolean;
}>();

const isMe = computed(() => props.message.fromUserId === $i.id);
const urls = computed(() => props.message.text ? extractUrlFromMfm(mfm.parse(props.message.text)) : []);

function showMenu(ev: MouseEvent) {
	const menu: MenuItem[] = [];

	menu.push({
		text: i18n.ts.copyContent,
		icon: 'ti ti-copy',
		action: () => {
			copyToClipboard(props.message.text);
		},
	});

	menu.push({
		type: 'divider',
	});

	if (isMe.value) {
		menu.push({
			text: i18n.ts.delete,
			icon: 'ti ti-trash',
			danger: true,
			action: () => {
				misskeyApi('chat/messages/delete', {
					messageId: props.message.id,
				});
			},
		});
	} else {
		menu.push({
			text: i18n.ts.reportAbuse,
			icon: 'ti ti-exclamation-circle',
			action: () => {
				const localUrl = `${url}/chat/messages/${props.message.id}`;
				const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
					user: props.user,
					initialComment: `${localUrl}\n-----\n`,
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;

	&.isMe {
		flex-direction: row-reverse;
		text-align: right;

		.content {
			color: var(--MI_THEME-fgOnAccent);
		}

		.footer {
			flex-direction: row-reverse;
		}
	}
}

.avatar {
	position: sticky;
	top: calc(16px + var(--MI-stickyTop, 0px));
	display: block;
	width: 52px;
	height: 52px;
}

.body {
	margin: 0 12px;
}

.content {
	overflow: clip;
	overflow-wrap: break-word;
	word-break: break-word;
}

.file {
}

.footer {
	display: flex;
	flex-direction: row;
	gap: 0.5em;
	margin-top: 4px;
	font-size: 75%;
}

.time {
	opacity: 0.5;
}
</style>
