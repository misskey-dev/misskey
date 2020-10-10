<template>
<div v-if="meta">
	<XSetup v-if="meta.requireSetup"/>
	<XEntrance v-else/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XSetup from './welcome.setup.vue';
import XEntrance from './welcome.entrance.vue';
import { instanceName } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		XSetup,
		XEntrance,
	},

	data() {
		return {
			INFO: {
				header: [{
					title: instanceName || 'Misskey',
					icon: null
				}]
			},
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},
});
</script>
