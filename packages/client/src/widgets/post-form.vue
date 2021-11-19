<template>
<XPostForm class="_panel" :fixed="true" :autofocus="false"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XPostForm from '@/components/post-form.vue';
import define from './define';

const widget = define({
	name: 'postForm',
	props: () => ({
	})
});

export default defineComponent({

	components: {
		XPostForm,
	},
	extends: widget,
});
</script>
