<template>
<div class="mkw-customize">
	<ui-button @click="customize()">{{ $t('@.customize-home') }}</ui-button>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'customize',
}).extend({
	i18n: i18n(),
	methods: {
		customize(date) {
			location.href = '/?customize';
		}
	}
});
</script>
