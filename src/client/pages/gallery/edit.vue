<template>
<FormBase>
	<FormSuspense :p="init">
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

		<FormButton v-if="postId" @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
		<FormButton v-else @click="save" primary><i class="fas fa-save"></i> {{ $ts.publish }}</FormButton>

		<FormButton v-if="postId" @click="del" danger><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import FormButton from '@client/components/form/button.vue';
import FormInput from '@client/components/form/input.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormTuple from '@client/components/form/tuple.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormSuspense from '@client/components/form/suspense.vue';
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
		FormSuspense,
	},

	props: {
		postId: {
			type: String,
			required: false,
			default: null,
		}
	},
	
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.postId ? {
				title: this.$ts.edit,
				icon: 'fas fa-pencil-alt'
			} : {
				title: this.$ts.postToGallery,
				icon: 'fas fa-pencil-alt'
			}),
			init: null,
			files: [],
			description: null,
			title: null,
			isSensitive: false,
		}
	},

	watch: {
		postId: {
			handler() {
				this.init = () => this.postId ? os.api('gallery/posts/show', {
					postId: this.postId
				}).then(post => {
					this.files = post.files;
					this.title = post.title;
					this.description = post.description;
					this.isSensitive = post.isSensitive;
				}) : Promise.resolve(null);
			},
			immediate: true,
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

		async save() {
			if (this.postId) {
				await os.apiWithDialog('gallery/posts/update', {
					postId: this.postId,
					title: this.title,
					description: this.description,
					fileIds: this.files.map(file => file.id),
					isSensitive: this.isSensitive,
				});
				this.$router.push(`/gallery/${this.postId}`);
			} else {
				const post = await os.apiWithDialog('gallery/posts/create', {
					title: this.title,
					description: this.description,
					fileIds: this.files.map(file => file.id),
					isSensitive: this.isSensitive,
				});
				this.$router.push(`/gallery/${post.id}`);
			}
		},

		async del() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$ts.deleteConfirm,
				showCancelButton: true
			});
			if (canceled) return;
			await os.apiWithDialog('gallery/posts/delete', {
				postId: this.postId,
			});
			this.$router.push(`/gallery`);
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
