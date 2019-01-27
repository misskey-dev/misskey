<template>
<prism :inline="inline" :language="lang || 'js'">{{ code }}</prism>
</template>

<script lang="ts">
import Vue from 'vue';
import 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import Prism from 'vue-prism-component';

export default Vue.extend({
	components: {
		Prism
	},
	props: {
		code: {
			type: String,
			required: true
		},
		lang: {
			type: String,
			required: false
		},
		inline: {
			type: Boolean,
			required: false
		}
	}
});
</script>
