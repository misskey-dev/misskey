<template>
<div class="mkw-onlineUsers" :class="{ _panel: !props.transparent, pad: !props.transparent }">
	<I18n v-if="onlineUsersCount" :src="$ts.onlineUsersCount" text-tag="span" class="text">
		<template #n><b>{{ onlineUsersCount }}</b></template>
	</I18n>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import define from './define';
import * as os from '@client/os';

const widget = define({
	name: 'onlineUsers',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	data() {
		return {
			onlineUsersCount: null,
			clock: null,
		};
	},
	created() {
		this.tick();
		this.clock = setInterval(this.tick, 1000 * 15);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			os.api('get-online-users-count').then(res => {
				this.onlineUsersCount = res.count;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mkw-onlineUsers {
	text-align: center;

	&.pad {
		padding: 16px 0;
	}

	> .text {
		::v-deep(b) {
			color: #41b781;
		}

		::v-deep(span) {
			opacity: 0.7;
		}
	}
}
</style>
