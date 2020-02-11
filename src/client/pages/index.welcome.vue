<template>
<div v-if="meta" class="mk-welcome">
	<portal to="title">{{ instanceName }}</portal>
	<x-setup v-if="meta.requireSetup"/>
	<x-entrance v-else/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XSetup from './index.welcome.setup.vue';
import XEntrance from './index.welcome.entrance.vue';
import { getInstanceName } from '../scripts/get-instance-name';

export default Vue.extend({
	components: {
		XSetup,
		XEntrance,
	},

	data() {
		return {
			instanceName: getInstanceName(),
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},
});
</script>
