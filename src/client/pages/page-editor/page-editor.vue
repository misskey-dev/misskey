<template>
<div>
	<div class="gwbmwxkm _panel">
		<header>
			<div class="title"><fa :icon="faStickyNote"/> {{ readonly ? $t('_pages.readPage') : pageId ? $t('_pages.editPage') : $t('_pages.newPage') }}</div>
			<div class="buttons">
				<button class="_button" @click="del()" v-if="!readonly"><fa :icon="faTrashAlt"/></button>
				<button class="_button" @click="() => showOptions = !showOptions"><fa :icon="faCog"/></button>
				<button class="_button" @click="save()" v-if="!readonly"><fa :icon="faSave"/></button>
			</div>
		</header>

		<section>
			<router-link class="view" v-if="pageId" :to="`/@${ author.username }/pages/${ currentName }`"><fa :icon="faExternalLinkSquareAlt"/> {{ $t('_pages.viewPage') }}</router-link>

			<mk-input v-model="title">
				<span>{{ $t('_pages.title') }}</span>
			</mk-input>

			<template v-if="showOptions">
				<mk-input v-model="summary">
					<span>{{ $t('_pages.summary') }}</span>
				</mk-input>

				<mk-input v-model="name">
					<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
					<span>{{ $t('_pages.url') }}</span>
				</mk-input>

				<mk-switch v-model="alignCenter">{{ $t('_pages.alignCenter') }}</mk-switch>

				<mk-select v-model="font">
					<template #label>{{ $t('_pages.font') }}</template>
					<option value="serif">{{ $t('_pages.fontSerif') }}</option>
					<option value="sans-serif">{{ $t('_pages.fontSansSerif') }}</option>
				</mk-select>

				<mk-switch v-model="hideTitleWhenPinned">{{ $t('_pages.hideTitleWhenPinned') }}</mk-switch>

				<div class="eyeCatch">
					<mk-button v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage()"><fa :icon="faPlus"/> {{ $t('_pages.eyeCatchingImageSet') }}</mk-button>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name"/>
						<mk-button @click="removeEyeCatchingImage()" v-if="!readonly"><fa :icon="faTrashAlt"/> {{ $t('_pages.eyeCatchingImageRemove') }}</mk-button>
					</div>
				</div>
			</template>

			<x-blocks class="content" v-model="content" :hpml="hpml"/>

			<mk-button @click="add()" v-if="!readonly"><fa :icon="faPlus"/></mk-button>
		</section>
	</div>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faMagic"/> {{ $t('_pages.variables') }}</template>
		<div class="qmuvgica">
			<x-draggable tag="div" class="variables" v-show="variables.length > 0" :list="variables" handle=".drag-handle" :group="{ name: 'variables' }" animation="150" swap-threshold="0.5">
				<x-variable v-for="variable in variables"
					:value="variable"
					:removable="true"
					@input="v => updateVariable(v)"
					@remove="() => removeVariable(variable)"
					:key="variable.name"
					:hpml="hpml"
					:name="variable.name"
					:title="variable.name"
					:draggable="true"
				/>
			</x-draggable>

			<mk-button @click="addVariable()" class="add" v-if="!readonly"><fa :icon="faPlus"/></mk-button>
		</div>
	</mk-container>

	<mk-container :body-togglable="true" :expanded="true">
		<template #header><fa :icon="faCode"/> {{ $t('script') }}</template>
		<div>
			<prism-editor v-model="script" :line-numbers="false" language="js"/>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as XDraggable from 'vuedraggable';
import "prismjs";
import 'prismjs/themes/prism-okaidia.css';
import PrismEditor from 'vue-prism-editor';
import { faICursor, faPlus, faMagic, faCog, faCode, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import XVariable from './page-editor.script-block.vue';
import XBlocks from './page-editor.blocks.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkContainer from '../../components/ui/container.vue';
import MkButton from '../../components/ui/button.vue';
import MkSelect from '../../components/ui/select.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkInput from '../../components/ui/input.vue';
import { blockDefs } from '../../scripts/hpml/index';
import { HpmlTypeChecker } from '../../scripts/hpml/type-checker';
import { url } from '../../config';
import { collectPageVars } from '../../scripts/collect-page-vars';
import { selectDriveFile } from '../../scripts/select-drive-file';

export default defineComponent({
	components: {
		XDraggable, XVariable, XBlocks, MkTextarea, MkContainer, MkButton, MkSelect, MkSwitch, MkInput, PrismEditor
	},

	props: {
		initPageId: {
			type: String,
			required: false
		},
		initPageName: {
			type: String,
			required: false
		},
		initUser: {
			type: String,
			required: false
		},
	},

	data() {
		return {
			author: this.$store.state.i,
			readonly: false,
			page: null,
			pageId: null,
			currentName: null,
			title: '',
			summary: null,
			name: Date.now().toString(),
			eyeCatchingImage: null,
			eyeCatchingImageId: null,
			font: 'sans-serif',
			content: [],
			alignCenter: false,
			hideTitleWhenPinned: false,
			variables: [],
			hpml: null,
			script: '',
			showOptions: false,
			url,
			faPlus, faICursor, faSave, faStickyNote, faMagic, faCog, faTrashAlt, faExternalLinkSquareAlt, faCode
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
		},
	},

	async created() {
		this.hpml = new HpmlTypeChecker();

		this.$watch('variables', () => {
			this.hpml.variables = this.variables;
		}, { deep: true });

		this.$watch('content', () => {
			this.hpml.pageVars = collectPageVars(this.content);
		}, { deep: true });

		if (this.initPageId) {
			this.page = await this.$root.api('pages/show', {
				pageId: this.initPageId,
			});
		} else if (this.initPageName && this.initUser) {
			this.page = await this.$root.api('pages/show', {
				name: this.initPageName,
				username: this.initUser,
			});
			this.readonly = true;
		}

		if (this.page) {
			this.author = this.page.user;
			this.pageId = this.page.id;
			this.title = this.page.title;
			this.name = this.page.name;
			this.currentName = this.page.name;
			this.summary = this.page.summary;
			this.font = this.page.font;
			this.script = this.page.script;
			this.hideTitleWhenPinned = this.page.hideTitleWhenPinned;
			this.alignCenter = this.page.alignCenter;
			this.content = this.page.content;
			this.variables = this.page.variables;
			this.eyeCatchingImageId = this.page.eyeCatchingImageId;
		} else {
			const id = uuid();
			this.content = [{
				id,
				type: 'text',
				text: 'Hello World!'
			}];
		}
	},

	provide() {
		return {
			readonly: this.readonly,
			getScriptBlockList: this.getScriptBlockList,
			getPageBlockList: this.getPageBlockList
		}
	},

	methods: {
		save() {
			const options = {
				title: this.title.trim(),
				name: this.name.trim(),
				summary: this.summary,
				font: this.font,
				script: this.script,
				hideTitleWhenPinned: this.hideTitleWhenPinned,
				alignCenter: this.alignCenter,
				content: this.content,
				variables: this.variables,
				eyeCatchingImageId: this.eyeCatchingImageId,
			};

			const onError = err => {
				if (err.id == '3d81ceae-475f-4600-b2a8-2bc116157532') {
					if (err.info.param == 'name') {
						this.$root.dialog({
							type: 'error',
							title: this.$t('_pages.invalidNameTitle'),
							text: this.$t('_pages.invalidNameText')
						});
					}
				} else if (err.code == 'NAME_ALREADY_EXISTS') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('_pages.nameAlreadyExists')
					});
				}
			};

			if (this.pageId) {
				options.pageId = this.pageId;
				this.$root.api('pages/update', options)
				.then(page => {
					this.currentName = this.name.trim();
					this.$root.dialog({
						type: 'success',
						text: this.$t('_pages.updated')
					});
				}).catch(onError);
			} else {
				this.$root.api('pages/create', options)
				.then(page => {
					this.pageId = page.id;
					this.currentName = this.name.trim();
					this.$root.dialog({
						type: 'success',
						text: this.$t('_pages.created')
					});
					this.$router.push(`/my/pages/edit/${this.pageId}`);
				}).catch(onError);
			}
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.title.trim() }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$root.api('pages/delete', {
					pageId: this.pageId,
				}).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('_pages.deleted')
					});
					this.$router.push(`/my/pages`);
				});
			});
		},

		async add() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: this.$t('_pages.chooseBlock'),
				select: {
					groupedItems: this.getPageBlockList()
				},
				showCancelButton: true
			});
			if (canceled) return;

			const id = uuid();
			this.content.push({ id, type });
		},

		async addVariable() {
			let { canceled, result: name } = await this.$root.dialog({
				title: this.$t('_pages.enterVariableName'),
				input: {
					type: 'text',
				},
				showCancelButton: true
			});
			if (canceled) return;

			name = name.trim();

			if (this.hpml.isUsedName(name)) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('_pages.variableNameIsAlreadyUsed')
				});
				return;
			}

			const id = uuid();
			this.variables.push({ id, name, type: null });
		},

		removeVariable(v) {
			const i = this.variables.findIndex(x => x.name === v.name);
			const newValue = [
				...this.variables.slice(0, i),
				...this.variables.slice(i + 1)
			];
			this.variables = newValue;
		},

		getPageBlockList() {
			return [{
				label: this.$t('_pages.contentBlocks'),
				items: [
					{ value: 'section', text: this.$t('_pages.blocks.section') },
					{ value: 'text', text: this.$t('_pages.blocks.text') },
					{ value: 'image', text: this.$t('_pages.blocks.image') },
					{ value: 'textarea', text: this.$t('_pages.blocks.textarea') },
					{ value: 'canvas', text: this.$t('_pages.blocks.canvas') },
				]
			}, {
				label: this.$t('_pages.inputBlocks'),
				items: [
					{ value: 'button', text: this.$t('_pages.blocks.button') },
					{ value: 'radioButton', text: this.$t('_pages.blocks.radioButton') },
					{ value: 'textInput', text: this.$t('_pages.blocks.textInput') },
					{ value: 'textareaInput', text: this.$t('_pages.blocks.textareaInput') },
					{ value: 'numberInput', text: this.$t('_pages.blocks.numberInput') },
					{ value: 'switch', text: this.$t('_pages.blocks.switch') },
					{ value: 'counter', text: this.$t('_pages.blocks.counter') }
				]
			}, {
				label: this.$t('_pages.specialBlocks'),
				items: [
					{ value: 'if', text: this.$t('_pages.blocks.if') },
					{ value: 'post', text: this.$t('_pages.blocks.post') }
				]
			}];
		},

		getScriptBlockList(type: string = null) {
			const list = [];

			const blocks = blockDefs.filter(block => type === null || block.out === null || block.out === type || typeof block.out === 'number');

			for (const block of blocks) {
				const category = list.find(x => x.category === block.category);
				if (category) {
					category.items.push({
						value: block.type,
						text: this.$t(`_pages.script.blocks.${block.type}`)
					});
				} else {
					list.push({
						category: block.category,
						label: this.$t(`_pages.script.categories.${block.category}`),
						items: [{
							value: block.type,
							text: this.$t(`_pages.script.blocks.${block.type}`)
						}]
					});
				}
			}

			const userFns = this.variables.filter(x => x.type === 'fn');
			if (userFns.length > 0) {
				list.unshift({
					label: this.$t(`_pages.script.categories.fn`),
					items: userFns.map(v => ({
						value: 'fn:' + v.name,
						text: v.name
					}))
				});
			}

			return list;
		},

		setEyeCatchingImage() {
			selectDriveFile(this.$root, false).then(file => {
				this.eyeCatchingImageId = file.id;
			});
		},

		removeEyeCatchingImage() {
			this.eyeCatchingImageId = null;
		}
	}
});
</script>

<style lang="scss" scoped>
.gwbmwxkm {
	margin-bottom: var(--margin);

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> [data-icon] {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;

			> button {
				padding: 0;
				width: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}
		}
	}

	> section {
		padding: 0 32px 32px 32px;

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		> .view {
			display: inline-block;
			margin: 16px 0 0 0;
			font-size: 14px;
		}

		> .content {
			margin-bottom: 16px;
		}

		> .eyeCatch {
			margin-bottom: 16px;

			> div {
				> img {
					max-width: 100%;
				}
			}
		}
	}
}

.qmuvgica {
	padding: 32px;

	@media (max-width: 500px) {
		padding: 16px;
	}

	> .variables {
		margin-bottom: 16px;
	}

	> .add {
		margin-bottom: 16px;
	}
}
</style>
