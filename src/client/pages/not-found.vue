<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img src="https://xn--931a.moe/assets/not-found.jpg" class="_ghost"/>
		<div>{{ $t('notFoundDescription') }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			info: {
				header: [{
					title: this.$t('notFound'),
					icon: faExclamationTriangle
				}]
			},
		}
	},
});
</script>
