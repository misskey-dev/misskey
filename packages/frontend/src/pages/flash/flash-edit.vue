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
				<MkButton v-if="flash" danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
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

const PRESET_DEFAULT = `/// @ 0.12.4

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
`;

const PRESET_OMIKUJI = `/// @ 0.12.4
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

const PRESET_SHUFFLE = `/// @ 0.12.4
// 巻き戻し可能な文字シャッフルのプリセット

let string = "ペペロンチーノ"
let length = string.len

// 過去の結果を保存しておくやつ
var results = []

// どれだけ巻き戻しているか
var cursor = 0

@do() {
	if (cursor != 0) {
		results = results.slice(0 (cursor + 1))
		cursor = 0
	}

	let chars = []
	for (let i, length) {
		let r = Math:rnd(0 (length - 1))
		chars.push(string.pick(r))
	}
	let result = chars.join("")

	results.push(result)

	// UIを表示
	render(result)
}

@back() {
	cursor = cursor + 1
	let result = results[results.len - (cursor + 1)]
	render(result)
}

@forward() {
	cursor = cursor - 1
	let result = results[results.len - (cursor + 1)]
	render(result)
}

@render(result) {
	Ui:render([
		Ui:C:container({
			align: 'center'
			children: [
				Ui:C:mfm({ text: result })
				Ui:C:buttons({
					buttons: [{
						text: "←"
						disabled: !(results.len > 1 && (results.len - cursor) > 1)
						onClick: back
					} {
						text: "→"
						disabled: !(results.len > 1 && cursor > 0)
						onClick: forward
					} {
						text: "引き直す"
						onClick: do
					}]
				})
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
}

do()
`;

const PRESET_TIMELINE = `/// @ 0.12.4
// APIリクエストを行いローカルタイムラインを表示するプリセット

@fetch() {
	Ui:render([
		Ui:C:container({
			align: 'center'
			children: [
				Ui:C:text({ text: "読み込み中..." })
			]
		})
	])

	// タイムライン取得
	let notes = Mk:api("notes/local-timeline" {})

	// それぞれのノートごとにUI要素作成
	let noteEls = []
	each (let note, notes) {
		let el = Ui:C:container({
			bgColor: "#444"
			fgColor: "#fff"
			padding: 10
			rounded: true
			children: [
				Ui:C:mfm({
					text: note.user.name
					bold: true
				})
				Ui:C:mfm({
					text: note.text
				})
			]
		})
		noteEls.push(el)
	}

	// UIを表示
	Ui:render([
		Ui:C:text({ text: "ローカル タイムライン" })
		Ui:C:button({
			text: "更新"
			onClick: @() {
				fetch()
			}
		})
		Ui:C:container({
			children: noteEls
		})
	])
}

fetch()
`;

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
let script = $ref(flash?.script ?? PRESET_DEFAULT);

function selectPreset(ev: MouseEvent) {
	os.popupMenu([{
		text: 'Omikuji',
		action: () => {
			script = PRESET_OMIKUJI;
		},
	}, {
		text: 'Shuffle',
		action: () => {
			script = PRESET_SHUFFLE;
		},
	}, {
		text: 'Timeline viewer',
		action: () => {
			script = PRESET_TIMELINE;
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

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: flash.title }),
	});
	if (canceled) return;

	await os.apiWithDialog('flash/delete', {
		flashId: props.id,
	});
	router.push('/play');
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
