<template>
<div>
	<div class="jqqmcavi" style="margin: 16px;">
		<MkButton v-if="pageId" class="button" inline link :to="`/@${ author.username }/pages/${ currentName }`"><i class="fas fa-external-link-square-alt"></i> {{ $ts._pages.viewPage }}</MkButton>
		<MkButton inline @click="save" primary class="button" v-if="!readonly"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
		<MkButton inline @click="duplicate" class="button" v-if="pageId"><i class="fas fa-copy"></i> {{ $ts.duplicate }}</MkButton>
		<MkButton inline @click="del" class="button" v-if="pageId && !readonly" danger><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</MkButton>
	</div>

	<div v-if="tab === 'settings'">
		<div style="padding: 16px;" class="_formRoot">
			<MkInput v-model="title" class="_formBlock">
				<template #label>{{ $ts._pages.title }}</template>
			</MkInput>

			<MkInput v-model="summary" class="_formBlock">
				<template #label>{{ $ts._pages.summary }}</template>
			</MkInput>

			<MkInput v-model="name" class="_formBlock">
				<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
				<template #label>{{ $ts._pages.url }}</template>
			</MkInput>

			<MkSwitch v-model="alignCenter" class="_formBlock">{{ $ts._pages.alignCenter }}</MkSwitch>

			<MkSelect v-model="font" class="_formBlock">
				<template #label>{{ $ts._pages.font }}</template>
				<option value="serif">{{ $ts._pages.fontSerif }}</option>
				<option value="sans-serif">{{ $ts._pages.fontSansSerif }}</option>
			</MkSelect>

			<MkSwitch v-model="hideTitleWhenPinned" class="_formBlock">{{ $ts._pages.hideTitleWhenPinned }}</MkSwitch>

			<div class="eyeCatch">
				<MkButton v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage"><i class="fas fa-plus"></i> {{ $ts._pages.eyeCatchingImageSet }}</MkButton>
				<div v-else-if="eyeCatchingImage">
					<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name" style="max-width: 100%;"/>
					<MkButton @click="removeEyeCatchingImage()" v-if="!readonly"><i class="fas fa-trash-alt"></i> {{ $ts._pages.eyeCatchingImageRemove }}</MkButton>
				</div>
			</div>
		</div>
	</div>

	<div v-else-if="tab === 'contents'">
		<div style="padding: 16px;">
			<XBlocks class="content" v-model="content" :hpml="hpml"/>

			<MkButton @click="add()" v-if="!readonly"><i class="fas fa-plus"></i></MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'variables'">
		<div class="qmuvgica">
			<XDraggable tag="div" class="variables" v-show="variables.length > 0" v-model="variables" item-key="name" handle=".drag-handle" :group="{ name: 'variables' }" animation="150" swap-threshold="0.5">
				<template #item="{element}">
					<XVariable
						:modelValue="element"
						:removable="true"
						@remove="() => removeVariable(element)"
						:hpml="hpml"
						:name="element.name"
						:title="element.name"
						:draggable="true"
					/>
				</template>
			</XDraggable>

			<MkButton @click="addVariable()" class="add" v-if="!readonly"><i class="fas fa-plus"></i></MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'script'">
		<div>
			<MkTextarea class="_code" v-model="script"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { v4 as uuid } from 'uuid';
import XVariable from './page-editor.script-block.vue';
import XBlocks from './page-editor.blocks.vue';
import MkTextarea from '@client/components/form/textarea.vue';
import MkContainer from '@client/components/ui/container.vue';
import MkButton from '@client/components/ui/button.vue';
import MkSelect from '@client/components/form/select.vue';
import MkSwitch from '@client/components/form/switch.vue';
import MkInput from '@client/components/form/input.vue';
import { blockDefs } from '@client/scripts/hpml/index';
import { HpmlTypeChecker } from '@client/scripts/hpml/type-checker';
import { url } from '@client/config';
import { collectPageVars } from '@client/scripts/collect-page-vars';
import * as os from '@client/os';
import { selectFile } from '@client/scripts/select-file';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
		XVariable, XBlocks, MkTextarea, MkContainer, MkButton, MkSelect, MkSwitch, MkInput,
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
			[symbols.PAGE_INFO]: computed(() => {
				let title = this.$ts._pages.newPage;
				if (this.initPageId) {
					title = this.$ts._pages.editPage;
				}
				else if (this.initPageName && this.initUser) {
					title = this.$ts._pages.readPage;
				}
				return {
					title: title,
					icon: 'fas fa-pencil-alt',
					bg: 'var(--bg)',
					tabs: [{
						active: this.tab === 'settings',
						title: this.$ts._pages.pageSetting,
						icon: 'fas fa-cog',
						onClick: () => { this.tab = 'settings'; },
					}, {
						active: this.tab === 'contents',
						title: this.$ts._pages.contents,
						icon: 'fas fa-sticky-note',
						onClick: () => { this.tab = 'contents'; },
					}, {
						active: this.tab === 'variables',
						title: this.$ts._pages.variables,
						icon: 'fas fa-magic',
						onClick: () => { this.tab = 'variables'; },
					}, {
						active: this.tab === 'script',
						title: this.$ts.script,
						icon: 'fas fa-code',
						onClick: () => { this.tab = 'script'; },
					}],
				};
			}),
			tab: 'settings',
			author: this.$i,
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
			url,
		};
	},

	watch: {
		async eyeCatchingImageId() {
			if (this.eyeCatchingImageId == null) {
				this.eyeCatchingImage = null;
			} else {
				this.eyeCatchingImage = await os.api('drive/files/show', {
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
			this.page = await os.api('pages/show', {
				pageId: this.initPageId,
			});
		} else if (this.initPageName && this.initUser) {
			this.page = await os.api('pages/show', {
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
		getSaveOptions() {
			return {
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
		},

		save() {
			const options = this.getSaveOptions();

			const onError = err => {
				if (err.id == '3d81ceae-475f-4600-b2a8-2bc116157532') {
					if (err.info.param == 'name') {
						os.dialog({
							type: 'error',
							title: this.$ts._pages.invalidNameTitle,
							text: this.$ts._pages.invalidNameText
						});
					}
				} else if (err.code == 'NAME_ALREADY_EXISTS') {
					os.dialog({
						type: 'error',
						text: this.$ts._pages.nameAlreadyExists
					});
				}
			};

			if (this.pageId) {
				options.pageId = this.pageId;
				os.api('pages/update', options)
				.then(page => {
					this.currentName = this.name.trim();
					os.dialog({
						type: 'success',
						text: this.$ts._pages.updated
					});
				}).catch(onError);
			} else {
				os.api('pages/create', options)
				.then(page => {
					this.pageId = page.id;
					this.currentName = this.name.trim();
					os.dialog({
						type: 'success',
						text: this.$ts._pages.created
					});
					this.$router.push(`/pages/edit/${this.pageId}`);
				}).catch(onError);
			}
		},

		del() {
			os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.title.trim() }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				os.api('pages/delete', {
					pageId: this.pageId,
				}).then(() => {
					os.dialog({
						type: 'success',
						text: this.$ts._pages.deleted
					});
					this.$router.push(`/pages`);
				});
			});
		},

		duplicate() {
			this.title = this.title + ' - copy';
			this.name = this.name + '-copy';
			os.api('pages/create', this.getSaveOptions()).then(page => {
				this.pageId = page.id;
				this.currentName = this.name.trim();
				os.dialog({
					type: 'success',
					text: this.$ts._pages.created
				});
				this.$router.push(`/pages/edit/${this.pageId}`);
			});
		},

		async add() {
			const { canceled, result: type } = await os.dialog({
				type: null,
				title: this.$ts._pages.chooseBlock,
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
			let { canceled, result: name } = await os.dialog({
				title: this.$ts._pages.enterVariableName,
				input: {
					type: 'text',
				},
				showCancelButton: true
			});
			if (canceled) return;

			name = name.trim();

			if (this.hpml.isUsedName(name)) {
				os.dialog({
					type: 'error',
					text: this.$ts._pages.variableNameIsAlreadyUsed
				});
				return;
			}

			const id = uuid();
			this.variables.push({ id, name, type: null });
		},

		removeVariable(v) {
			this.variables = this.variables.filter(x => x.name !== v.name);
		},

		getPageBlockList() {
			return [{
				label: this.$ts._pages.contentBlocks,
				items: [
					{ value: 'section', text: this.$ts._pages.blocks.section },
					{ value: 'text', text: this.$ts._pages.blocks.text },
					{ value: 'image', text: this.$ts._pages.blocks.image },
					{ value: 'textarea', text: this.$ts._pages.blocks.textarea },
					{ value: 'note', text: this.$ts._pages.blocks.note },
					{ value: 'canvas', text: this.$ts._pages.blocks.canvas },
				]
			}, {
				label: this.$ts._pages.inputBlocks,
				items: [
					{ value: 'button', text: this.$ts._pages.blocks.button },
					{ value: 'radioButton', text: this.$ts._pages.blocks.radioButton },
					{ value: 'textInput', text: this.$ts._pages.blocks.textInput },
					{ value: 'textareaInput', text: this.$ts._pages.blocks.textareaInput },
					{ value: 'numberInput', text: this.$ts._pages.blocks.numberInput },
					{ value: 'switch', text: this.$ts._pages.blocks.switch },
					{ value: 'counter', text: this.$ts._pages.blocks.counter }
				]
			}, {
				label: this.$ts._pages.specialBlocks,
				items: [
					{ value: 'if', text: this.$ts._pages.blocks.if },
					{ value: 'post', text: this.$ts._pages.blocks.post }
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

		setEyeCatchingImage(e) {
			selectFile(e.currentTarget || e.target, null, false).then(file => {
				this.eyeCatchingImageId = file.id;
			});
		},

		removeEyeCatchingImage() {
			this.eyeCatchingImageId = null;
		},

		highlighter(code) {
			return highlight(code, languages.js, 'javascript');
		},
	}
});
</script>

<style lang="scss" scoped>
.jqqmcavi {
	> .button {
		& + .button {
			margin-left: 8px;
		}
	}
}

.gwbmwxkm {
	position: relative;

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
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
	padding: 16px;

	> .variables {
		margin-bottom: 16px;
	}

	> .add {
		margin-bottom: 16px;
	}
}
</style>
