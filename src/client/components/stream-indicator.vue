<template>
	<div class="disconnect-notify" v-if="stream.state == 'connected' && hasDisconnected" @click="resetDisconnected">
		<div>{{ $t('disconnectedFromServer') }}</div>
		<div class="command">
			<button @click="reload">{{ $t('reload') }}</button>
			<button>{{ $t('doNothing') }}</button>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';

export default Vue.extend({
	i18n,
	data() {
		return {
			hasDisconnected: false,
		}
	},
	computed: {
		stream() {
			return this.$root.stream;
		},
	},
	created() {
		this.$root.stream.on('_connected_', this.onConnected);
		this.$root.stream.on('_disconnected_', this.onDisconnected);
	},
	beforeDestroy() {
		this.$root.stream.off('_connected_', this.onConnected);
		this.$root.stream.off('_disconnected_', this.onDisconnected);
	},
	methods: {
		onConnected() {
			if (this.hasDisconnected) {
				if (this.$store.state.device.autoReload) {
					this.reload();
				}
			}
		},
		onDisconnected() {
			this.hasDisconnected = true;
		},
		resetDisconnected() {
			this.hasDisconnected = false;
		},
		reload() {
			location.reload();
		},
	}
});
</script>

<style lang="scss" scoped>
.disconnect-notify {
	position: fixed;
	z-index: 16385;
	bottom: 8px;
	right: 8px;
	margin: 0;
	padding: 6px 12px;
	font-size: 0.9em;
	color: #fff;
	background: #000;
	opacity: 0.8;
	border-radius: 4px;
	max-width: 320px;

	> .command {
		display: flex;
		justify-content: space-around;

		> button {
			color: #aaa;
			padding: 0.7em;
			background: transparent;
			border: none;
			cursor: pointer;

			&:hover {
				color: #fff;
			}
		}
	}
}
</style>
