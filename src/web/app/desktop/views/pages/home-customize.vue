<template>
<mk-home customize/>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.title = 'Misskey - ホームのカスタマイズ';
	}
});
</script>
