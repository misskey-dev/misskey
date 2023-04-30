<template>
<MkContainer :show-header="widgetProps.showHeader" :scrollable="false" class="mkw-koteitag data-cy-mkw-koteitag">
	<template #icon><i class="ti ti-hash"></i></template>
	<template #header>{{ i18n.ts._widgets.koteitag }}</template>

	<div :class="$style.container">
		<div>
			<MkSelect :class="$style.select" v-model="programs">
				<template #label><i class="ti ti-hash"></i>実況する番組を選択</template>
				<option v-for="option in widgetProps.options" v-bind:value="option.key">{{option.label}}</option>
			</MkSelect>
		</div>
		<div>
			<MkButton :class="$style.button" class="get" @click="getPrograms"><i :class="$style.iconInner" class="ti ti-reload"></i></MkButton>
		</div>
		<div v-if="widgetProps.options.length < 2">
			番組表を取得中。
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';

const name = 'koteitag';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: false,
	},
	programs: {
		type: 'object' as const,
		default: null,
	},
	options: {
		type: 'object' as const,
		default: null,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();
const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);
const programs = ref('');
let commandToot = [
	'command: user_config',
	'tagging:',
];

const getPrograms = async () => {
	widgetProps.options = {
		clear_tags: {key:'clear_tags' ,label: 'タグをクリア'},
		episode_browser: {key:'episode_browser' ,label: 'その他の番組'},
	};

	fetch('/mulukhiya/api/program/update', {method: 'POST'})
		.then(e => fetch('/mulukhiya/api/program'))
		.then(e => e.json())
		.then(e => {
			widgetProps.programs = e;
			Object.keys(widgetProps.programs).map(key => {
				const program = widgetProps.programs[key];
				if (!program.enable) return;
				let label = [program.series];
				if (program.episode) {label.push(`第${program.episode}${program.episode_suffix || '話'}`)};
				if (program.subtitle) {label.push(`「${program.subtitle}」`)};
				if (program.livecure) {label.push(program.air ? 'エア番組実況用タグ' : '実況用タグ')};
				if (program.minutes) {label.push(`${program.minutes}分`)};
				widgetProps.options[key] = {key: key, label: label.join(' ')};
			});
		}).catch(e => os.alert({type: 'error', title: '番組表の取得', text: e.message}));
}

const setPrograms = async () => {
	if (!programs.value) return;
	switch (programs.value) {
		case 'episode_browser':
			os.confirm({
				type: 'info',
				title: 'エピソードブラウザで他の番組を探しますか？',
			}).then(({ canceled }) => {
				programs.value = null;
				if (canceled) return;
				window.open('/mulukhiya/app/episode');
			});
			return;

		case 'clear_tags':
			commandToot.push('  user_tags: null');
			break;

		default:
			const program = widgetProps.programs[programs.value];
			commandToot.push('  user_tags:');
			commandToot.push(`  - ${program.series}`);
			if (program.episode) {commandToot.push(`  - ${program.episode}${program.episode_suffix || '話'}`)};
			if (program.subtitle) {commandToot.push(`  - ${program.subtitle}`)};
			if (program.air) {commandToot.push('  - エア番組')};
			if (program.livecure) {commandToot.push('  - 実況')};
			if (program.extra_tags) {program.extra_tags.map(t => commantToot.push(`  - ${t}`))};
			if (program.minutes) {commandToot.push(`  minutes: ${program.minutes}`)};
			break;
	}

	const envelope = {
		localOnly: true, // コマンドトゥートは連合に流す必要なし
		poll: null,
		text: commandToot.join("\n"),
		visibility: 'specified',
		visibleUserIds: [],
	};

	os.confirm({
		type: 'info',
		title: 'この番組でよろしいでしょうか？',
		text: widgetProps.options[programs.value].label,
	}).then(({ canceled }) => {
		programs.value = null;
		if (canceled) return;
		os.api('notes/create', envelope).then(() => {
			os.toast('固定タグ用コマンドを送信しました。');
		});
	});
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});

watch([programs], () => emit('update:modelValue', setPrograms()), {
	deep: true,
});

getPrograms();

</script>

<style lang="scss" module>
.select {
	padding: 5px;
}
.container {
	display: grid;
	grid-template-columns: 85% 15%;
	grid-column-gap: 5px;
	align-items: end;
}
.button {
	margin-bottom: 5px;
	min-width: 60%;
	min-height: 35px;
	padding: 0;
}
.iconInner {
	display: block;
	margin: 0 auto;
	font-size: 12px;
}
</style>
