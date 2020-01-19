<template>
<x-window @closed="() => { $emit('closed'); destroyDom(); }">
	<template #header></template>
	<div>
		<x-drive/>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XDrive from './drive.vue';
import XWindow from './window.vue';

export default Vue.extend({
	i18n,

	components: {
		XDrive,
		XWindow,
	},

	props: {
	},

	methods: {
	}
});
</script>
