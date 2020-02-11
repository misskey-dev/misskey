<template>
<div class="ipledcug">
	<portal to="icon"><fa :icon="faExclamationTriangle"/></portal>
	<portal to="title">{{ $t('notFound') }}</portal>

	<section class="_card">
		<div class="_content">
			<img src="https://xn--931a.moe/assets/not-found.png" alt=""/>
			<div>{{ $t('notFoundDescription') }}</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

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
				pointer-events: none;
				user-select: none;
			}
		}
	}
}
</style>
