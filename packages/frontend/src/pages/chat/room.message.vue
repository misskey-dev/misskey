<template>
<div :class="[$style.root, { [$style.isMe]: isMe }]">
	<MkAvatar :class="$style.avatar" :user="user" indicator link preview/>
	<div :class="$style.body">
		<MkFukidashi :class="$style.fukidashi" :tail="isMe ? 'right' : 'left'" :accented="isMe">
			<div v-if="!message.isDeleted" :class="$style.content">
				<Mfm v-if="message.text" ref="text" class="_selectable" :text="message.text" :i="$i"/>
				<div v-if="message.file" :class="$style.file">
					<a :href="message.file.url" rel="noopener" target="_blank" :title="message.file.name">
						<img v-if="message.file.type.split('/')[0] == 'image'" :src="message.file.url" :alt="message.file.name"/>
						<p v-else>{{ message.file.name }}</p>
					</a>
				</div>
			</div>
			<div v-else :class="$style.content">
				<p>{{ i18n.ts.deleted }}</p>
			</div>
		</MkFukidashi>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" style="margin: 8px 0;"/>
		<div>
			<MkTime :class="$style.time" :time="message.createdAt"/>
		</div>
	</div>
	<button v-if="isMe" :class="$style.delete" :title="i18n.ts.delete" @click="del">
		<img src="/client-assets/remove.png" alt="Delete"/>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { extractUrlFromMfm } from '@/utility/extract-url-from-mfm.js';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkFukidashi from '@/components/MkFukidashi.vue';

const $i = ensureSignin();

const props = defineProps<{
	message: Misskey.entities.ChatMessageLite;
	user: Misskey.entities.User;
	isRoom?: boolean;
}>();

const isMe = computed(() => props.message.fromUserId === $i.id);
const urls = computed(() => props.message.text ? extractUrlFromMfm(mfm.parse(props.message.text)) : []);

function del(): void {
	misskeyApi('chat/messages/delete', {
		messageId: props.message.id,
	});
}
</script>

<style lang="scss" module>
.root {
	$me-balloon-color: var(--accent);

	position: relative;
	background-color: transparent;
	display: flex;

	&.isMe {
		flex-direction: row-reverse;
		text-align: right;

		.content {
			color: var(--MI_THEME-fgOnAccent);
		}
	}
}

.avatar {
	position: sticky;
	top: calc(var(--stickyTop, 0px) + 16px);
	display: block;
	width: 54px;
	height: 54px;
	transition: all 0.1s ease;
}

.body {
	margin: 0 12px;
}

.content {
	overflow: hidden;
	overflow-wrap: break-word;
	word-break: break-word;
}

.delete {
	position: absolute;
	top: 0;
	right: 0;
	width: 24px;
	height: 24px;
	padding: 0;
	margin: 0;
	border: none;
	background: none;
	cursor: pointer;
	transition: all 0.1s ease;

	&:hover {
		transform: scale(1.1);
	}
}

.time {
	font-size: 75%;
	opacity: 0.7;
}
</style>
