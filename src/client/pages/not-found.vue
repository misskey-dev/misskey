<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img src="https://xn--931a.moe/assets/not-found.jpg" class="_ghost"/>
		<div>{{ $ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as os from '@client/os';

export default defineComponent({
	data() {
		return {
			INFO: {
				title: this.$ts.notFound,
				icon: faExclamationTriangle
			},
		}
	},
});
</script>
