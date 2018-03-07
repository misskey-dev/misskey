<template>
<mk-ui>
	<span slot="header">%fa:gamepad%オセロ</span>
	<mk-othello/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.title = 'Misskey オセロ';
		document.documentElement.style.background = '#fff';
	}
});
</script>
