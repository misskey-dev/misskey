<template>
<div class="gwbmwxkm" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<header>
		<div class="title"><fa :icon="faStickyNote"/> {{ pageId ? 'Edit page' : 'New page' }}</div>
		<div class="buttons">
			<button @click="save()">
				<fa :icon="faSave"/>
			</button>
		</div>
	</header>

	<section style="padding:16px;">
		<ui-input v-model="title"></ui-input>

		<template v-for="child in content">
			<component :is="'x-' + child.type" :value="child" @input="v => updateItem(v)" @remove="() => remove(child)" :key="child.id"/>
		</template>

		<ui-button @click="add()"><fa :icon="faPlus"/> {{ $t('add-item') }}</ui-button>

		<details>
			<summary>Scripting</summary>
			<fa :icon="faSquareRootAlt"/> Variables
			<ui-button @click="addVariable()"><fa :icon="faPlus"/></ui-button>

			<section class="">
				<div class="variables">
					<template v-for="variable in variables">
						<x-variable :value="variable" :removable="true" @input="v => updateVariable(v)" @remove="() => removeVariable(variable)" :key="variable.id" :ai-script="aiScript" :id="variable.id" :title="variable.name"/>
					</template>
				</div>
			</section>
		</details>

		<details>
			<summary>Source</summary>
			<pre>{{ JSON.stringify({ content, variables }, null, 2) }}</pre>
		</details>

		<details>
			<summary>Assembly</summary>
			<pre>{{ JSON.stringify(evVars, null, 2) }}</pre>
			<ui-button @click="ev()">eval</ui-button>
		</details>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faICursor, faPlus, faSquareRootAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XContainer from './page-editor.container.vue';
import XVariable from './page-editor.script-block.vue';
import XSection from './page-editor.section.vue';
import XText from './page-editor.text.vue';
import XImage from './page-editor.image.vue';
import XButton from './page-editor.button.vue';
import * as uuid from 'uuid';
import { AiScript } from '../../../scripts/aiscript';

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
			content: [],
			variables: [],
			evVars: [],
			aiScript: null,
			faPlus, faICursor, faSave, faStickyNote, faSquareRootAlt
		};
	},

	created() {
		this.aiScript = new AiScript(this.variables);
		if (this.page) {
			this.$root.api('pages/show', {
				pageId: this.page,
			}).then(page => {
				this.pageId = page.id;
				this.title = page.title;
				this.content = page.content;
				this.variables = page.variables;
			});
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
					title: this.title,
					content: this.content,
					variables: this.variables,
				}).then(page => {
					this.$root.dialog({
						type: 'success',
						text: 'Page updated'
					});
				});
			} else {
				this.$root.api('pages/create', {
					title: this.title,
					content: this.content,
					variables: this.variables,
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.gwbmwxkm
	overflow hidden
	background var(--face)

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

</style>
