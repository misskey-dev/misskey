<template>
<button class="zuvgdzyu _button" @click="menu">
	<img :src="emoji.url" class="img" loading="lazy"/>
	<div class="body">
		<div class="name _monospace">{{ emoji.name }}</div>
		<div class="info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { i18n } from '@/i18n';

const props = defineProps<{
	emoji: {
		name: string;
		aliases: string[];
		category: string;
		url: string;
	};
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
			os.apiGet('emoji', { name: props.emoji.name }).then(res => {
				os.alert({
					type: 'info',
					text: `License: ${res.license}`,
				});
			});
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" scoped>
.zuvgdzyu {
	display: flex;
	align-items: center;
	padding: 12px;
	text-align: left;
	background: var(--panel);
	border-radius: 8px;

	&:hover {
		border-color: var(--accent);
	}

	> .img {
		width: 42px;
		height: 42px;
		object-fit: contain;
	}

	> .body {
		padding: 0 0 0 8px;
		white-space: nowrap;
		overflow: hidden;

		> .name {
			text-overflow: ellipsis;
			overflow: hidden;
		}

		> .info {
			opacity: 0.5;
			font-size: 0.9em;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
}
</style>
