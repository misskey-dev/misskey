<template>
<mk-window ref="window" width="450px" height="500px" @closed="destroyDom">
	<template #header><fa icon="list"/> {{ list.title }}</template>

	<x-editor :list="list"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import XEditor from '../../../common/views/components/user-list-editor.vue';

export default Vue.extend({
	components: {
		XEditor
	},

	props: {
		list: {
			required: true
		}
	}
});
</script>
