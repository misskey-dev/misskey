<template>
<div class="">
	<portal to="header"><Fa :icon="faShareAlt"/>{{ $t('share') }}</portal>

	<section class="_card">
		<div class="_title" v-if="title">{{ title }}</div>
		<div class="_content">
			<div>{{ text }}</div>
			<XPostForm v-if="!posted" fixed :instant="true" :initial-text="initialText" @posted="posted = true"/>
			<MkButton v-else primary @click="close()">{{ $t('close') }}</MkButton>
		</div>
		<div class="_footer" v-if="url">{{ url }}</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import XPostForm from '@/components/post-form.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('share') as string
		};
	},

	components: {
		XPostForm,
		MkButton,
	},

	data() {
		return {
			title: null,
			text: null,
			url: null,
			initialText: null,
			posted: false,

			faShareAlt
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
