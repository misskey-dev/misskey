<template>
<div>
	<div class="gwbmwxkm" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<header>
			<div class="title"><fa :icon="faStickyNote"/> {{ pageId ? $t('edit-page') : $t('new-page') }}</div>
			<div class="buttons">
				<button @click="() => showOptions = !showOptions"><fa :icon="faCog"/></button>
				<button @click="save()"><fa :icon="faSave"/></button>
			</div>
		</header>

		<section>
			<ui-input v-model="title">
				<span>{{ $t('title') }}</span>
			</ui-input>

			<template v-if="showOptions">
				<ui-input v-model="name">
					<template #prefix>{{ url }}/@{{ $store.state.i.username }}/pages/</template>
					<span>{{ $t('url') }}</span>
				</ui-input>

				<ui-switch v-model="alignCenter">{{ $t('align-center') }}</ui-switch>

				<ui-select v-model="font">
					<template #label>{{ $t('font') }}</template>
					<option value="serif">{{ $t('fontSerif') }}</option>
					<option value="sans-serif">{{ $t('fontSansSerif') }}</option>
				</ui-select>

				<div class="eyeCatch">
					<ui-button v-if="eyeCatchingImageId == null" @click="setEyeCatchingImage()"><fa :icon="faPlus"/> {{ $t('set-eye-catchig-image') }}</ui-button>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name"/>
						<ui-button @click="removeEyeCatchingImage()"><fa :icon="faTrashAlt"/> {{ $t('remove-eye-catchig-image') }}</ui-button>
					</div>
				</div>
			</template>

			<div class="content" v-for="child in content">
				<component :is="'x-' + child.type" :value="child" @input="v => updateItem(v)" @remove="() => remove(child)" :key="child.id"/>
			</div>

			<ui-button @click="add()"><fa :icon="faPlus"/></ui-button>
		</section>
	</div>

	<ui-container :body-togglable="true">
		<template #header><fa :icon="faSquareRootAlt"/> {{ $t('variables') }}</template>
		<div class="qmuvgica">
			<div class="variables" v-show="variables.length > 0">
				<template v-for="variable in variables">
					<x-variable :value="variable" :removable="true" @input="v => updateVariable(v)" @remove="() => removeVariable(variable)" :key="variable.id" :ai-script="aiScript" :id="variable.id" :title="variable.name"/>
				</template>
			</div>

			<ui-button @click="addVariable()" class="add"><fa :icon="faPlus"/></ui-button>

			<details>
				<summary>Preview</summary>
				<pre>{{ JSON.stringify(evVars, null, 2) }}</pre>
				<ui-button @click="ev()">eval</ui-button>
			</details>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faICursor, faPlus, faSquareRootAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XContainer from './page-editor.container.vue';
import XVariable from './page-editor.script-block.vue';
import XSection from './page-editor.section.vue';
import XText from './page-editor.text.vue';
import XImage from './page-editor.image.vue';
import XButton from './page-editor.button.vue';
import * as uuid from 'uuid';
import { AiScript } from '../../../scripts/aiscript';
import { url } from '../../../../config';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer, XVariable, XSection, XText, XImage, XButton
	},

	props: {
		page: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			pageId: null,
			title: '',
			name: '',
			eyeCatchingImage: null,
			eyeCatchingImageId: null,
			font: 'sans-serif',
			content: [],
			alignCenter: false,
			variables: [],
			evVars: [],
			aiScript: null,
			showOptions: false,
			url,
			faPlus, faICursor, faSave, faStickyNote, faSquareRootAlt, faCog, faTrashAlt
		};
	},

	watch: {
		async eyeCatchingImageId() {
			if (this.eyeCatchingImageId == null) {
				this.eyeCatchingImage = null;
			} else {
				this.eyeCatchingImage = await this.$root.api('drive/files/show', {
					fileId: this.eyeCatchingImageId,
				});
			}
		}
	},

	created() {
		this.aiScript = new AiScript(this.variables);
		if (this.page) {
			this.$root.api('pages/show', {
				pageId: this.page,
			}).then(page => {
				this.pageId = page.id;
				this.title = page.title;
				this.name = page.name || '';
				this.font = page.font;
				this.alignCenter = page.alignCenter;
				this.content = page.content;
				this.variables = page.variables;
				this.eyeCatchingImageId = page.eyeCatchingImageId;
			});
		} else {
			const id = uuid.v4();
			this.content = [{
				id,
				type: 'text',
				text: 'Hello World!'
			}];
		}
	},

	provide() {
		return {
			getScriptItemList: this.getScriptItemList
		}
	},

	methods: {
		save() {
			if (this.pageId) {
				this.$root.api('pages/update', {
					pageId: this.pageId,
					title: this.title.trim(),
					name: this.name.trim() === '' ? null : name.trim(),
					font: this.font,
					alignCenter: this.alignCenter,
					content: this.content,
					variables: this.variables,
					eyeCatchingImageId: this.eyeCatchingImageId,
				}).then(page => {
					this.$root.dialog({
						type: 'success',
						text: 'Page updated'
					});
				});
			} else {
				this.$root.api('pages/create', {
					title: this.title.trim(),
					name: this.name.trim() === '' ? null : name.trim(),
					font: this.font,
					alignCenter: this.alignCenter,
					content: this.content,
					variables: this.variables,
					eyeCatchingImageId: this.eyeCatchingImageId,
				}).then(page => {
					this.pageId = page.id;
					this.$root.dialog({
						type: 'success',
						text: 'Page crated'
					});
					this.$router.push(`/i/pages/edit/${this.pageId}`);
				});
			}
		},

		async add() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: 'Select type',
				select: {
					items: [{
						value: 'section', text: 'Section'
					}, {
						value: 'text', text: 'Text'
					}, {
						value: 'image', text: 'Image'
					}, {
						value: 'button', text: 'Button'
					}]
				},
				showCancelButton: true
			});
			if (canceled) return;

			const id = uuid.v4();
			this.content.push({ id, type });
		},

		async addVariable() {
			const { canceled, result: name } = await this.$root.dialog({
				title: 'Enter name',
				input: {
					type: 'text',
				},
				showCancelButton: true
			});
			if (canceled) return;

			const { canceled2, result: type } = await this.$root.dialog({
				type: null,
				title: 'Select type',
				select: {
					items: this.getScriptItemList()
				},
				showCancelButton: true
			});
			if (canceled2) return;

			const id = uuid.v4();
			this.variables.push({ id, name, type });
		},

		updateItem(v) {
			const i = this.content.findIndex(x => x.id === v.id);
			const newValue = [
				...this.content.slice(0, i),
				v,
				...this.content.slice(i + 1)
			];
			this.content = newValue;
		},

		remove(el) {
			const i = this.content.findIndex(x => x.id === el.id);
			const newValue = [
				...this.content.slice(0, i),
				...this.content.slice(i + 1)
			];
			this.content = newValue;
		},

		getScriptItemList(type: string = null) {
			return AiScript.blockDefs.filter(block => type === null || block.out === null || block.out === type).map(block => ({
				value: block.type,
				text: this.$t(`script.blocks.${block.type}`)
			}));
		},

		ev() {
			try {
				this.evVars = this.aiScript.evaluateVars();
			} catch(e) {
				console.error(e);
				this.evVars = [];
			}
		},

		setEyeCatchingImage() {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				this.eyeCatchingImageId = file.id;
			});
		},

		removeEyeCatchingImage() {
			this.eyeCatchingImageId = null;
		}
	}
});
</script>

<style lang="stylus" scoped>
.gwbmwxkm
	overflow hidden
	background var(--face)
	margin-bottom 16px

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	> header
		background var(--faceHeader)

		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

			> [data-icon]
				margin-right 6px

			&:empty
				display none

		> .buttons
			position absolute
			z-index 2
			top 0
			right 0

			> button
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color var(--faceTextButton)

				&:hover
					color var(--faceTextButtonHover)

				&:active
					color var(--faceTextButtonActive)

	> section
		padding 0 32px 32px 32px

		@media (max-width 500px)
			padding 0 16px 16px 16px

		> .content
			margin-bottom 16px

		> .eyeCatch
			margin-bottom 16px

			> div
				> img
					max-width 100%

.qmuvgica
	padding 32px

	@media (max-width 500px)
		padding 16px

	> .variables
		margin-bottom 16px

	> .add
		margin-bottom 16px

</style>
