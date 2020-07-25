<template>
<div class="ipledcug">
	<portal to="icon"><fa :icon="faExclamationTriangle"/></portal>
	<portal to="title">{{ $t('notFound') }}</portal>

	<div class="_fullinfo">
		<img src="https://xn--931a.moe/assets/not-found.jpg" class="_ghost"/>
		<div>{{ $t('notFoundDescription') }}</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('notFound') as string
		};
	},

	data() {
		return {
			faExclamationTriangle
		}
	},
});
</script>
