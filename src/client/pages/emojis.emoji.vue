<template>
<button class="zuvgdzyu _button" @click="menu">
	<img :src="emoji.url" class="img" :alt="emoji.name"/>
	<div class="body">
		<div class="name _monospace">{{ emoji.name }}</div>
		<div class="info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import VanillaTilt from 'vanilla-tilt';

export default defineComponent({
	props: {
		emoji: {
			type: Object,
			required: true,
		}
	},

	mounted() {
		VanillaTilt.init(this.$el, {
			reverse: true,
			gyroscope: false,
			scale: 1.1,
			speed: 500,
		});
	},

	methods: {
		menu(ev) {
			os.popupMenu([{
				type: 'label',
				text: ':' + this.emoji.name + ':',
			}, {
				text: this.$ts.copy,
				icon: 'fas fa-copy',
				action: () => {
					copyToClipboard(`:${this.emoji.name}:`);
					os.success();
				}
			}], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.zuvgdzyu {
	display: flex;
	align-items: center;
	padding: 12px;
	text-align: left;
	background: var(--panel);
	border-radius: 8px;
	transform-style: preserve-3d;
	transform: perspective(1000px);

	&:hover {
		border-color: var(--accent);
	}

	> .img {
		width: 42px;
		height: 42px;
		transform: translateZ(20px);
	}

	> .body {
		padding: 0 0 0 8px;
		white-space: nowrap;
		overflow: hidden;
		transform: translateZ(10px);

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
