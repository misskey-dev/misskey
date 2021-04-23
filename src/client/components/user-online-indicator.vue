<template>
<div class="fzgwjkgc" :class="user.onlineStatus" v-tooltip="text"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		user: {
			type: Object,
			required: true
		},
	},

	computed: {
		text(): string {
			switch (this.user.onlineStatus) {
				case 'online': return this.$ts.online;
				case 'active': return this.$ts.active;
				case 'offline': return this.$ts.offline;
				case 'unknown': return this.$ts.unknown;
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.fzgwjkgc {
	box-shadow: 0 0 0 3px var(--panel);
	border-radius: 120%; // Blinkのバグか知らんけど、100%ぴったりにすると何故か若干楕円でレンダリングされる

	&.online {
		background: #58d4c9;
	}

	&.active {
		background: #e4bc48;
	}

	&.offline {
		background: #ea5353;
	}

	&.unknown {
		background: #888;
	}
}
</style>
