<template>
<FormBase>
	<FormInput v-model:value="title">
		<span>{{ $ts.title }}</span>
	</FormInput>

	<FormTextarea v-model:value="description" :max="500">
		<span>{{ $ts.description }}</span>
	</FormTextarea>

	<FormGroup>
		<div v-for="file in files" :key="file.id" class="_formItem _formPanel wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : null }">
			<div class="name">{{ file.name }}</div>
			<button class="remove _button" @click="remove(file)" v-tooltip="$ts.remove"><i class="fas fa-times"></i></button>
		</div>
		<FormButton @click="selectFile" primary><i class="fas fa-plus"></i> {{ $ts.attachFile }}</FormButton>
	</FormGroup>

	<FormSwitch v-model:value="isSensitive">{{ $ts.markAsSensitive }}</FormSwitch>

	<FormButton @click="publish" primary><i class="fas fa-save"></i> {{ $ts.publish }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@client/components/form/button.vue';
import FormInput from '@client/components/form/input.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormTuple from '@client/components/form/tuple.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import { selectFile } from '@client/scripts/select-file';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormBase,
		FormGroup,
	},
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.postToGallery,
				icon: 'fas fa-pencil-alt'
			},
			files: [],
			description: null,
			title: null,
			isSensitive: false,
		}
	},

	methods: {
		selectFile(e) {
			selectFile(e.currentTarget || e.target, null, true).then(files => {
				this.files = this.files.concat(files);
			});
		},

		remove(file) {
			this.files = this.files.filter(f => f.id !== file.id);
		},

		async publish() {
			const post = await os.apiWithDialog('gallery/posts/create', {
				title: this.title,
				description: this.description,
				fileIds: this.files.map(file => file.id),
				isSensitive: this.isSensitive,
			});

			this.$router.push(`/gallery/${post.id}`);
		}
	}
});
</script>

<style lang="scss" scoped>
.wqugxsfx {
	height: 200px;
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	position: relative;

	> .name {
		position: absolute;
		top: 8px;
		left: 9px;
		padding: 8px;
		background: var(--panel);
	}

	> .remove {
		position: absolute;
		top: 8px;
		right: 9px;
		padding: 8px;
		background: var(--panel);
	}
}
</style>
