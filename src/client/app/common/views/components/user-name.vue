<template>
<mfm :text="user.name || user.username" :plain="true" :nowrap="true" :custom-emojis="user.emojis"/>
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
