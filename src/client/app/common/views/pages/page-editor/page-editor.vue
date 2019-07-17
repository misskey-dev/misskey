<template>
<div>
	<div class="gwbmwxkm" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<header>
			<div class="title"><fa :icon="faStickyNote"/> {{ readonly ? $t('read-page') : pageId ? $t('edit-page') : $t('new-page') }}</div>
			<div class="buttons">
				<button @click="del()" v-if="!readonly"><fa :icon="faTrashAlt"/></button>
				<button @click="() => showOptions = !showOptions"><fa :icon="faCog"/></button>
				<button @click="save()" v-if="!readonly"><fa :icon="faSave"/></button>
			</div>
		</header>

		<section>
			<router-link class="view" v-if="pageId" :to="`/@${ author.username }/pages/${ currentName }`"><fa :icon="faExternalLinkSquareAlt"/> {{ $t('view-page') }}</router-link>

			<ui-input v-model="title">
				<span>{{ $t('title') }}</span>
			</ui-input>

			<template v-if="showOptions">
				<ui-input v-model="summary">
					<span>{{ $t('summary') }}</span>
				</ui-input>

				<ui-input v-model="name">
					<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
					<span>{{ $t('url') }}</span>
				</ui-input>

				<ui-switch v-model="alignCenter">{{ $t('align-center') }}</ui-switch>

				<ui-select v-model="font">
					<template #label>{{ $t('font') }}</template>
					<option value="serif">{{ $t('fontSerif') }}</option>
					<option value="sans-serif">{{ $t('fontSansSerif') }}</option>
				</ui-select>

				<ui-switch v-model="hideTitleWhenPinned">{{ $t('hide-title-when-pinned') }}</ui-switch>

				<div class="eyeCatch">
					<ui-button v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage()"><fa :icon="faPlus"/> {{ $t('set-eye-catching-image') }}</ui-button>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name"/>
						<ui-button @click="removeEyeCatchingImage()" v-if="!readonly"><fa :icon="faTrashAlt"/> {{ $t('remove-eye-catching-image') }}</ui-button>
					</div>
				</div>
			</template>

			<x-blocks class="content" v-model="content" :ai-script="aiScript"/>

			<ui-button @click="add()" v-if="!readonly"><fa :icon="faPlus"/></ui-button>
		</section>
	</div>

	<ui-container :body-togglable="true">
		<template #header><fa :icon="faMagic"/> {{ $t('variables') }}</template>
		<div class="qmuvgica">
			<x-draggable tag="div" class="variables" v-show="variables.length > 0" :list="variables" handle=".drag-handle" :group="{ name: 'variables' }" animation="150" swap-threshold="0.5">
				<x-variable v-for="variable in variables"
					:value="variable"
					:removable="true"
					@input="v => updateVariable(v)"
					@remove="() => removeVariable(variable)"
					:key="variable.name"
					:ai-script="aiScript"
					:name="variable.name"
					:title="variable.name"
					:draggable="true"
				/>
			</x-draggable>

			<ui-button @click="addVariable()" class="add" v-if="!readonly"><fa :icon="faPlus"/></ui-button>

			<ui-info><span v-html="$t('variables-info')"></span><a @click="() => moreDetails = true" style="display:block;">{{ $t('more-details') }}</a></ui-info>

			<template v-if="moreDetails">
				<ui-info><span v-html="$t('variables-info2')"></span></ui-info>
				<ui-info><span v-html="$t('variables-info3')"></span></ui-info>
				<ui-info><span v-html="$t('variables-info4')"></span></ui-info>
			</template>
		</div>
	</ui-container>

	<ui-container :body-togglable="true" :expanded="false">
		<template #header><fa :icon="faCode"/> {{ $t('inspector') }}</template>
		<div style="padding:0 32px 32px 32px;">
			<ui-textarea :value="JSON.stringify(content, null, 2)" readonly tall>{{ $t('content') }}</ui-textarea>
			<ui-textarea :value="JSON.stringify(variables, null, 2)" readonly tall>{{ $t('variables') }}</ui-textarea>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import { faICursor, faPlus, faMagic, faCog, faCode, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../../i18n';
import XVariable from './page-editor.script-block.vue';
import XBlocks from './page-editor.blocks.vue';
import * as uuid from 'uuid';
import { blockDefs } from '../../../../../../misc/aiscript/index';
import { ASTypeChecker } from '../../../../../../misc/aiscript/type-checker';
import { url } from '../../../../config';
import { collectPageVars } from '../../../scripts/collect-page-vars';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XDraggable, XVariable, XBlocks
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
			aiScript: null,
			showOptions: false,
			moreDetails: false,
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
		this.aiScript = new ASTypeChecker();

		this.$watch('variables', () => {
			this.aiScript.variables = this.variables;
		}, { deep: true });

		this.$watch('content', () => {
			this.aiScript.pageVars = collectPageVars(this.content);
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
			this.hideTitleWhenPinned = this.page.hideTitleWhenPinned;
			this.alignCenter = this.page.alignCenter;
			this.content = this.page.content;
			this.variables = this.page.variables;
			this.eyeCatchingImageId = this.page.eyeCatchingImageId;
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
			readonly: this.readonly,
			getScriptBlockList: this.getScriptBlockList,
			getPageBlockList: this.getPageBlockList
		}
	},

	methods: {
		save() {
			if (this.pageId) {
				this.$root.api('pages/update', {
					pageId: this.pageId,
					title: this.title.trim(),
					name: this.name.trim(),
					summary: this.summary,
					font: this.font,
					hideTitleWhenPinned: this.hideTitleWhenPinned,
					alignCenter: this.alignCenter,
					content: this.content,
					variables: this.variables,
					eyeCatchingImageId: this.eyeCatchingImageId,
				}).then(page => {
					this.currentName = this.name.trim();
					this.$root.dialog({
						type: 'success',
						text: this.$t('page-updated')
					});
				});
			} else {
				this.$root.api('pages/create', {
					title: this.title.trim(),
					name: this.name.trim(),
					summary: this.summary,
					font: this.font,
					hideTitleWhenPinned: this.hideTitleWhenPinned,
					alignCenter: this.alignCenter,
					content: this.content,
					variables: this.variables,
					eyeCatchingImageId: this.eyeCatchingImageId,
				}).then(page => {
					this.pageId = page.id;
					this.currentName = this.name.trim();
					this.$root.dialog({
						type: 'success',
						text: this.$t('page-created')
					});
					this.$router.push(`/i/pages/edit/${this.pageId}`);
				});
			}
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('are-you-sure-delete'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$root.api('pages/delete', {
					pageId: this.pageId,
				}).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('page-deleted')
					});
					this.$router.push(`/i/pages`);
				});
			});
		},

		async add() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: this.$t('choose-block'),
				select: {
					groupedItems: this.getPageBlockList()
				},
				showCancelButton: true
			});
			if (canceled) return;

			const id = uuid.v4();
			this.content.push({ id, type });
		},

		async addVariable() {
			let { canceled, result: name } = await this.$root.dialog({
				title: this.$t('enter-variable-name'),
				input: {
					type: 'text',
				},
				showCancelButton: true
			});
			if (canceled) return;

			name = name.trim();

			if (this.aiScript.isUsedName(name)) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('the-variable-name-is-already-used')
				});
				return;
			}

			const id = uuid.v4();
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
				label: this.$t('content-blocks'),
				items: [
					{ value: 'section', text: this.$t('blocks.section') },
					{ value: 'text', text: this.$t('blocks.text') },
					{ value: 'image', text: this.$t('blocks.image') },
					{ value: 'textarea', text: this.$t('blocks.textarea') },
				]
			}, {
				label: this.$t('input-blocks'),
				items: [
					{ value: 'button', text: this.$t('blocks.button') },
					{ value: 'radioButton', text: this.$t('blocks.radioButton') },
					{ value: 'textInput', text: this.$t('blocks.textInput') },
					{ value: 'textareaInput', text: this.$t('blocks.textareaInput') },
					{ value: 'numberInput', text: this.$t('blocks.numberInput') },
					{ value: 'switch', text: this.$t('blocks.switch') },
					{ value: 'counter', text: this.$t('blocks.counter') }
				]
			}, {
				label: this.$t('special-blocks'),
				items: [
					{ value: 'if', text: this.$t('blocks.if') },
					{ value: 'post', text: this.$t('blocks.post') }
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
						text: this.$t(`script.blocks.${block.type}`)
					});
				} else {
					list.push({
						category: block.category,
						label: this.$t(`script.categories.${block.category}`),
						items: [{
							value: block.type,
							text: this.$t(`script.blocks.${block.type}`)
						}]
					});
				}
			}

			const userFns = this.variables.filter(x => x.type === 'fn');
			if (userFns.length > 0) {
				list.unshift({
					label: this.$t(`script.categories.fn`),
					items: userFns.map(v => ({
						value: 'fn:' + v.name,
						text: v.name
					}))
				});
			}

			return list;
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

		> .view
			display inline-block
			margin 16px 0 0 0
			font-size 14px

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
