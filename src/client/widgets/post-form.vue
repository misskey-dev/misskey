<template>
<XPostForm class="_panel"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XPostForm from '@/components/post-form.vue';
import define from './define';
import * as os from '@/os';

const widget = define({
	name: 'postForm',
	props: () => ({
	})
});

export default defineComponent({
	extends: widget,

	components: {
		XPostForm,
	},

	data() {
		return {
		};
	},

	methods: {
	}
});
</script>
