<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="_gaps">
			<MkInput v-model="title">
				<template #label>{{ i18n.ts._play.title }}</template>
			</MkInput>
			<MkTextarea v-model="summary">
				<template #label>{{ i18n.ts._play.summary }}</template>
			</MkTextarea>
			<MkButton primary @click="selectPreset">{{ i18n.ts.selectFromPresets }}<i class="ti ti-chevron-down"></i></MkButton>
			<MkTextarea v-model="script" class="_monospace" tall spellcheck="false">
				<template #label>{{ i18n.ts._play.script }}</template>
			</MkTextarea>
			<div class="_buttons">
				<MkButton primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				<MkButton @click="show"><i class="ti ti-eye"></i> {{ i18n.ts.show }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onUnmounted, Ref, ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { url } from '@/config';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInput from '@/components/MkInput.vue';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

let flash = $ref(null);

if (props.id) {
	flash = await os.api('flash/show', {
		flashId: props.id,
	});
}

let title = $ref(flash?.title ?? 'New Play');
let summary = $ref(flash?.summary ?? '');
let permissions = $ref(flash?.permissions ?? []);
let script = $ref(flash?.script ?? `/// @ 0.12.2

var name = ""

Ui:render([
	Ui:C:textInput({
		label: "Your name"
		onInput: @(v) { name = v }
	})
	Ui:C:button({
		text: "Hello"
		onClick: @() {
			Mk:dialog(null \`Hello, {name}!\`)
		}
	})
])
`);

function selectPreset(ev: MouseEvent) {
	os.popupMenu([{
		text: 'Omikuji',
		action: () => {
			script = `/// @ 0.12.2
// ユーザーごとに日替わりのおみくじのプリセット

// 選択肢
let choices = [
	"ｷﾞｶﾞ吉"
	"大吉"
	"吉"
	"中吉"
	"小吉"
	"末吉"
	"凶"
	"大凶"
]

// シードが「ユーザーID+今日の日付」である乱数生成器を用意
let random = Math:gen_rng(\`{USER_ID}{Date:year()}{Date:month()}{Date:day()}\`)

// ランダムに選択肢を選ぶ
let chosen = choices[random(0 (choices.len - 1))]

// 結果のテキスト
let result = \`今日のあなたの運勢は **{chosen}** です。\`

// UIを表示
Ui:render([
	Ui:C:container({
		align: 'center'
		children: [
			Ui:C:mfm({ text: result })
			Ui:C:postFormButton({
				text: "投稿する"
				rounded: true
				primary: true
				form: {
					text: \`{result}{Str:lf}{THIS_URL}\`
				}
			})
		]
	})
])
`;
		},
	}], ev.currentTarget ?? ev.target);
}

async function save() {
	if (flash) {
		os.apiWithDialog('flash/update', {
			flashId: props.id,
			title,
			summary,
			permissions,
			script,
		});
	} else {
		const created = await os.apiWithDialog('flash/create', {
			title,
			summary,
			permissions,
			script,
		});
		router.push('/play/' + created.id + '/edit');
	}
}

function show() {
	if (flash == null) {
		os.alert({
			text: 'Please save',
		});
	} else {
		os.pageWindow(`/play/${flash.id}`);
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => flash ? {
	title: i18n.ts._play.edit + ': ' + flash.title,
} : {
	title: i18n.ts._play.new,
}));
</script>

<style lang="scss" scoped>

</style>
