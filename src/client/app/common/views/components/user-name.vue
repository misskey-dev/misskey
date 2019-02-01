<template>
<mfm :text="user.name || user.username" :should-break="false" :plain-text="true" :custom-emojis="user.emojis"/>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		}
	}
});
</script>
