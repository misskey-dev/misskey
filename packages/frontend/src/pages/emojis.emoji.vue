<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button v-if="request" class="_button emoji-request" :class="$style.root" @click="menu">
	<img :src="emoji.url" :class="$style.img" loading="lazy"/>
	<div class="body">
		<div class="name _monospace">{{ emoji.name + ' (request)' }}</div>
		<div class="info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
<button v-else class="_button" :class="$style.root" @click="menu">
	<img :src="emoji.url" :class="$style.img" loading="lazy"/>
	<div :class="$style.body">
		<div class="name _monospace">{{ emoji.name }}</div>
		<div class="info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
</template>

<script lang="ts" setup>
import * as os from '@/os.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
  emoji: {
    name: string;
    aliases: string[];
    category: string;
    url: string;
  };
  request?: boolean;
}>();

function menu(ev) {
	os.popupMenu([{
		type: 'label',
		text: ':' + props.emoji.name + ':',
	}, {
		text: i18n.ts.copy,
		icon: 'ti ti-copy',
		action: () => {
			copyToClipboard(`:${props.emoji.name}:`);
			os.success();
		},
	}, {
		text: i18n.ts.info,
		icon: 'ti ti-info-circle',
		action: () => {
			os.apiGet('emoji-requests', { name: props.emoji.name }).then(res => {
				os.alert({
					type: 'info',
					text: `License: ${res.license}`,
				});
			});
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
  display: flex;
  align-items: center;
  padding: 12px;
  text-align: left;
  background: var(--panel);
  border-radius: 8px;

  &:hover {
    border-color: var(--accent);
  }
}

.img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.body {
  padding: 0 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
}

.name {
  text-overflow: ellipsis;
  overflow: hidden;
}

.info {
  opacity: 0.5;
  font-size: 0.9em;
  text-overflow: ellipsis;
  overflow: hidden;
}

.emoji-request {
  --c: rgb(255 196 0 / 15%);;
  background-image: linear-gradient(45deg,var(--c) 16.67%,transparent 16.67%,transparent 50%,var(--c) 50%,var(--c) 66.67%,transparent 66.67%,transparent 100%);
  background-size: 16px 16px;
}
</style>
