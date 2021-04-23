<template>
<div class="">
	<section class="_section">
		<div class="_title" v-if="title">{{ title }}</div>
		<div class="_content">
			<XPostForm v-if="!posted" fixed :instant="true" :initial-text="initialText" @posted="posted = true" class="_panel"/>
			<MkButton v-else primary @click="close()">{{ $ts.close }}</MkButton>
		</div>
		<div class="_footer" v-if="url">{{ url }}</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import XPostForm from '@client/components/post-form.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XPostForm,
		MkButton,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.share,
				icon: 'fas fa-share-alt'
			},
			title: null,
			text: null,
			url: null,
			initialText: null,
			posted: false,

		}
	},

	created() {
		const urlParams = new URLSearchParams(window.location.search);
		this.title = urlParams.get('title');
		this.text = urlParams.get('text');
		this.url = urlParams.get('url');
		
		let text = '';
		if (this.title) text += `【${this.title}】\n`;
		if (this.text) text += `${this.text}\n`;
		if (this.url) text += `${this.url}`;
		this.initialText = text.trim();
	},

	methods: {
		close() {
			window.close()
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
