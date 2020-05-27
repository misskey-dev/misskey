<template>
<div class="ipledcug">
	<portal to="icon"><fa :icon="faExclamationTriangle"/></portal>
	<portal to="title">{{ $t('notFound') }}</portal>

	<section class="_card">
		<div class="_content">
			<img src="https://xn--931a.moe/assets/not-found.jpg" class="_ghost"/>
			<div>{{ $t('notFoundDescription') }}</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
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

<style lang="scss" scoped>
.ipledcug {
	> ._card {
		> ._content {
			text-align: center;
					
			> img {
				vertical-align: bottom;
				height: 150px;
				margin-bottom: 16px;
				border-radius: 16px;
			}
		}
	}
}
</style>
