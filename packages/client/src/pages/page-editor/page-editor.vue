<template>
<MkSpacer :content-max="700">
	<div class="jqqmcavi">
		<MkButton v-if="pageId" class="button" inline link :to="`/@${ author.username }/pages/${ currentName }`"><i class="fas fa-external-link-square-alt"></i> {{ i18n.ts._pages.viewPage }}</MkButton>
		<MkButton v-if="!readonly" inline primary class="button" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
		<MkButton v-if="pageId" inline class="button" @click="duplicate"><i class="fas fa-copy"></i> {{ i18n.ts.duplicate }}</MkButton>
		<MkButton v-if="pageId && !readonly" inline class="button" danger @click="del"><i class="fas fa-trash-alt"></i> {{ i18n.ts.delete }}</MkButton>
	</div>

	<div v-if="tab === 'settings'">
		<div class="_formRoot">
			<MkInput v-model="title" class="_formBlock">
				<template #label>{{ i18n.ts._pages.title }}</template>
			</MkInput>

			<MkInput v-model="summary" class="_formBlock">
				<template #label>{{ i18n.ts._pages.summary }}</template>
			</MkInput>

			<MkInput v-model="name" class="_formBlock">
				<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
				<template #label>{{ i18n.ts._pages.url }}</template>
			</MkInput>

			<MkSwitch v-model="alignCenter" class="_formBlock">{{ i18n.ts._pages.alignCenter }}</MkSwitch>

			<MkSelect v-model="font" class="_formBlock">
				<template #label>{{ i18n.ts._pages.font }}</template>
				<option value="serif">{{ i18n.ts._pages.fontSerif }}</option>
				<option value="sans-serif">{{ i18n.ts._pages.fontSansSerif }}</option>
			</MkSelect>

			<MkSwitch v-model="hideTitleWhenPinned" class="_formBlock">{{ i18n.ts._pages.hideTitleWhenPinned }}</MkSwitch>

			<div class="eyeCatch">
				<MkButton v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage"><i class="fas fa-plus"></i> {{ i18n.ts._pages.eyeCatchingImageSet }}</MkButton>
				<div v-else-if="eyeCatchingImage">
					<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name" style="max-width: 100%;"/>
					<MkButton v-if="!readonly" @click="removeEyeCatchingImage()"><i class="fas fa-trash-alt"></i> {{ i18n.ts._pages.eyeCatchingImageRemove }}</MkButton>
				</div>
			</div>
		</div>
	</div>

	<div v-else-if="tab === 'contents'">
		<div>
			<XBlocks v-model="content" class="content" :hpml="hpml"/>

			<MkButton v-if="!readonly" @click="add()"><i class="fas fa-plus"></i></MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'variables'">
		<div class="qmuvgica">
			<XDraggable v-show="variables.length > 0" v-model="variables" tag="div" class="variables" item-key="name" handle=".drag-handle" :group="{ name: 'variables' }" animation="150" swap-threshold="0.5">
				<template #item="{element}">
					<XVariable
						:modelValue="element"
						:removable="true"
						:hpml="hpml"
						:name="element.name"
						:title="element.name"
						:draggable="true"
						@remove="() => removeVariable(element)"
					/>
				</template>
			</XDraggable>

			<MkButton v-if="!readonly" class="add" @click="addVariable()"><i class="fas fa-plus"></i></MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'script'">
		<div>
			<MkTextarea v-model="script" class="_code"/>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, watch } from 'vue';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { v4 as uuid } from 'uuid';
import XVariable from './page-editor.script-block.vue';
import XBlocks from './page-editor.blocks.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkButton from '@/components/ui/button.vue';
import MkSelect from '@/components/form/select.vue';
import MkSwitch from '@/components/form/switch.vue';
import MkInput from '@/components/form/input.vue';
import { blockDefs } from '@/scripts/hpml/index';
import { HpmlTypeChecker } from '@/scripts/hpml/type-checker';
import { url } from '@/config';
import { collectPageVars } from '@/scripts/collect-page-vars';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import * as symbols from '@/symbols';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { MisskeyNavigator } from '@/scripts/navigate';

const nav = new MisskeyNavigator();

const props = defineProps<{
	initPageId: string,
	initPageName: string,
	initUser: string
}>();

const XDraggable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

let tab: string = $ref('settings');
let author: any = $ref($i);
let readonly: boolean = $ref(false);
let page: any = $ref(null);
let pageId: any = $ref(null);
let currentName: any = $ref(null);
let title: string = $ref('');
let summary: any = $ref(null);
let name: string = $ref(Date.now().toString());
let eyeCatchingImage: any = $ref(null);
let eyeCatchingImageId: any = $ref(null);
let font: string = $ref('sans-serif');
let content: any[] = $ref([]);
let alignCenter: boolean = $ref(false);
let hideTitleWhenPinned: boolean = $ref(false);
let variables: any[] = $ref([]);
let hpml: any = $ref(new HpmlTypeChecker());
let script: string = $ref('');

provide('readonly', readonly);
provide('getScriptBlockList', getScriptBlockList);
provide('getPageBlockList', getPageBlockList);

watch(eyeCatchingImageId, async () => {
	if (eyeCatchingImageId == null) {
		eyeCatchingImage = null;
	} else {
		eyeCatchingImage = await os.api('drive/files/show', {
			fileId: eyeCatchingImageId,
		});
	}
});

watch(variables, () => {
	hpml.variables = variables;
}, { deep: true });

watch(content, () => {
	hpml.pageVars = collectPageVars(content);
}, { deep: true });

if (props.initPageId) {
	os.api('pages/show', {
		pageId: props.initPageId,
	}).then((pageResponse) => {
		page = pageResponse
	});
} else if (props.initPageName && props.initUser) {
	os.api('pages/show', {
		name: props.initPageName,
		username: props.initUser,
	}).then((pageResponse) => {
		page = pageResponse
	});
	
	readonly = true;
}

if (page) {
	author = page.user;
	pageId = page.id;
	title = page.title;
	name = page.name;
	currentName = page.name;
	summary = page.summary;
	font = page.font;
	script = page.script;
	hideTitleWhenPinned = page.hideTitleWhenPinned;
	alignCenter = page.alignCenter;
	content = page.content;
	variables = page.variables;
	eyeCatchingImageId = page.eyeCatchingImageId;
} else {
	const id = uuid();
	content = [{
		id,
		type: 'text',
		text: 'Hello World!'
	}];
}

function getSaveOptions() {
	return {
		title: title.trim(),
		name: name.trim(),
		summary: summary,
		font: font,
		script: script,
		hideTitleWhenPinned: hideTitleWhenPinned,
		alignCenter: alignCenter,
		content: content,
		variables: variables,
		eyeCatchingImageId: eyeCatchingImageId,
	};
}

function save() {
	const options = getSaveOptions();

	const onError = err => {
		if (err.id === '3d81ceae-475f-4600-b2a8-2bc116157532') {
			if (err.info.param === 'name') {
				os.alert({
					type: 'error',
					title: i18n.ts._pages.invalidNameTitle,
					text: i18n.ts._pages.invalidNameText
				});
			}
		} else if (err.code === 'NAME_ALREADY_EXISTS') {
			os.alert({
				type: 'error',
				text: i18n.ts._pages.nameAlreadyExists
			});
		}
	};

	if (pageId) {
		options.pageId = pageId;
		os.api('pages/update', options)
		.then(pageResponse => {
			currentName = name.trim();
			os.alert({
				type: 'success',
				text: i18n.ts._pages.updated
			});
		}).catch(onError);
	} else {
		os.api('pages/create', options)
		.then(pageResponse => {
			pageId = pageResponse.id;
			currentName = name.trim();
			os.alert({
				type: 'success',
				text: i18n.ts._pages.created
			});
			nav.push(`/pages/edit/${pageId}`);
		}).catch(onError);
	}
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: title.trim() }),
	}).then(({ canceled }) => {
		if (canceled) return;
		os.api('pages/delete', {
			pageId: pageId,
		}).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts._pages.deleted
			});
			nav.push(`/pages`);
		});
	});
}

function duplicate() {
	title = title + ' - copy';
	name = name + '-copy';
	os.api('pages/create', getSaveOptions()).then(page => {
		pageId = page.id;
		currentName = name.trim();
		os.alert({
			type: 'success',
			text: i18n.ts._pages.created
		});
		nav.push(`/pages/edit/${pageId}`);
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		type: null,
		title: i18n.ts._pages.chooseBlock,
		groupedItems: getPageBlockList()
	});
	if (canceled) return;

	const id = uuid();
	content.push({ id, type });
}

async function addVariable() {
	let { canceled, result: varName } = await os.inputText({
		title: i18n.ts._pages.enterVariableName,
	});
	if (canceled) return;

	varName = varName!.trim();

	if (hpml.isUsedName(varName)) {
		os.alert({
			type: 'error',
			text: i18n.ts._pages.variableNameIsAlreadyUsed
		});
		return;
	}

	const id = uuid();
	variables.push({ id, name: varName, type: null });
}

function removeVariable(v) {
	variables = variables.filter(x => x.name !== v.name);
}

function getPageBlockList() {
	return [{
		label: i18n.ts._pages.contentBlocks,
		items: [
			{ value: 'section', text: i18n.ts._pages.blocks.section },
			{ value: 'text', text: i18n.ts._pages.blocks.text },
			{ value: 'image', text: i18n.ts._pages.blocks.image },
			{ value: 'textarea', text: i18n.ts._pages.blocks.textarea },
			{ value: 'note', text: i18n.ts._pages.blocks.note },
			{ value: 'canvas', text: i18n.ts._pages.blocks.canvas },
		]
	}, {
		label: i18n.ts._pages.inputBlocks,
		items: [
			{ value: 'button', text: i18n.ts._pages.blocks.button },
			{ value: 'radioButton', text: i18n.ts._pages.blocks.radioButton },
			{ value: 'textInput', text: i18n.ts._pages.blocks.textInput },
			{ value: 'textareaInput', text: i18n.ts._pages.blocks.textareaInput },
			{ value: 'numberInput', text: i18n.ts._pages.blocks.numberInput },
			{ value: 'switch', text: i18n.ts._pages.blocks.switch },
			{ value: 'counter', text: i18n.ts._pages.blocks.counter }
		]
	}, {
		label: i18n.ts._pages.specialBlocks,
		items: [
			{ value: 'if', text: i18n.ts._pages.blocks.if },
			{ value: 'post', text: i18n.ts._pages.blocks.post }
		]
	}];
}

function getScriptBlockList(type: string = '') {
	const list: any[] = [];

	const blocks = blockDefs.filter(block => type === null || block.out === null || block.out === type || typeof block.out === 'number');

	for (const block of blocks) {
		const category = list.find(x => x.category === block.category);
		if (category) {
			category.items.push({
				value: block.type,
				text: i18n.t(`_pages.script.blocks.${block.type}`)
			});
		} else {
			list.push({
				category: block.category,
				label: i18n.t(`_pages.script.categories.${block.category}`),
				items: [{
					value: block.type,
					text: i18n.t(`_pages.script.blocks.${block.type}`)
				}]
			});
		}
	}

	const userFns = variables.filter(x => x.type === 'fn');
	if (userFns.length > 0) {
		list.unshift({
			label: i18n.t(`_pages.script.categories.fn`),
			items: userFns.map(v => ({
				value: 'fn:' + v.name,
				text: v.name
			}))
		});
	}

	return list;
}

function setEyeCatchingImage(ev) {
	selectFile(ev.currentTarget ?? ev.target, null).then(file => {
		eyeCatchingImageId = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId = null;
}

defineExpose({
	[symbols.PAGE_INFO]: $computed(() => {
		let pageTitle = i18n.ts._pages.newPage;
		if (props.initPageId) {
			pageTitle = i18n.ts._pages.editPage;
		}
		else if (props.initPageName && props.initUser) {
			pageTitle = i18n.ts._pages.readPage;
		}
		return {
			title: pageTitle,
			icon: 'fas fa-pencil-alt',
			bg: 'var(--bg)',
			tabs: [{
				active: tab === 'settings',
				title: i18n.ts._pages.pageSetting,
				icon: 'fas fa-cog',
				onClick: () => { tab = 'settings'; },
			}, {
				active: tab === 'contents',
				title: i18n.ts._pages.contents,
				icon: 'fas fa-sticky-note',
				onClick: () => { tab = 'contents'; },
			}, {
				active: tab === 'variables',
				title: i18n.ts._pages.variables,
				icon: 'fas fa-magic',
				onClick: () => { tab = 'variables'; },
			}, {
				active: tab === 'script',
				title: i18n.ts.script,
				icon: 'fas fa-code',
				onClick: () => { tab = 'script'; },
			}],
		};
	})
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
