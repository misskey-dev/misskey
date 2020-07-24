<template>
<div v-if="meta" class="mk-welcome">
	<portal to="title">{{ instanceName }}</portal>
	<x-setup v-if="meta.requireSetup"/>
	<x-entrance v-else/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XSetup from './index.welcome.setup.vue';
import XEntrance from './index.welcome.entrance.vue';
import { instanceName } from '../config';

export default defineComponent({
	components: {
		XSetup,
		XEntrance,
	},

	data() {
		return {
			instanceName: instanceName || 'Misskey',
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},
});
</script>
