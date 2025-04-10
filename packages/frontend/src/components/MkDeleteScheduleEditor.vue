<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.padding]: !afterOnly }]">
	<div
		v-if="!afterOnly" :class="[$style.label, { [$style.withAccent]: !showDetail }]"
		@click="showDetail = !showDetail"
	>
		<i
			class="ti"
			:class="showDetail ? 'ti-chevron-up' : 'ti-chevron-down'"
		></i> {{
			summaryText }}
	</div>
	<MkInfo v-if="!isValid" warn>
		<template v-if="invalidInput">
			{{ i18n.ts.invalidValue }}
		</template>
		<template v-else-if="isEmpty">
			{{ i18n.ts.cannotScheduleInputIsRequired }}
		</template>
		<template v-else-if="isOverOneYear">
			{{ i18n.ts.cannotScheduleLaterThanOneYear }}
		</template>
	</MkInfo>
	<section v-if="afterOnly || showDetail">
		<div>
			<MkSelect v-if="!afterOnly" v-model="expiration" small>
				<template #label>{{ i18n.ts._poll.expiration }}</template>
				<option value="at">{{ i18n.ts._poll.at }}</option>
				<option value="after">{{ i18n.ts._poll.after }}</option>
			</MkSelect>
			<section v-if="expiration === 'at'">
				<MkInput v-model="atDate" small type="date" class="input">
					<template #label>{{ i18n.ts._poll.deadlineDate }}</template>
				</MkInput>
				<MkInput v-model="atTime" small type="time" class="input">
					<template #label>{{ i18n.ts._poll.deadlineTime }}</template>
				</MkInput>
			</section>
			<section v-else-if="expiration === 'after'">
				<MkInput
					v-model="after" small type="text" class="input" :pattern="'^[1-9][0-9]*$'"
					inputmode="numeric" @input="handleInput" @blur="validateInput"
				>
					<template #label>{{ i18n.ts._poll.duration }}</template>
				</MkInput>
				<MkSelect v-model="unit" small>
					<option value="second">{{ i18n.ts._time.second }}</option>
					<option value="minute">{{ i18n.ts._time.minute }}</option>
					<option value="hour">{{ i18n.ts._time.hour }}</option>
					<option value="day">{{ i18n.ts._time.day }}</option>
				</MkSelect>
			</section>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from 'vue';
import MkInput from './MkInput.vue';
import MkSelect from './MkSelect.vue';
import MkInfo from './MkInfo.vue';
import { formatDateTimeString } from '@/utility/format-time-string.js';
import { addTime } from '@/utility/time.js';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';

export type DeleteScheduleEditorModelValue = {
	deleteAt: number | null;
	deleteAfter: number | null;
	isValid: boolean;
};

const props = defineProps<{
	modelValue: DeleteScheduleEditorModelValue;
	afterOnly?: boolean;
}>();
const emit = defineEmits<{
	(ev: 'update:modelValue', v: DeleteScheduleEditorModelValue): void;
}>();

const expiration = ref<'at' | 'after'>('after');
const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');
const after = ref('');
const unit = ref<'second' | 'minute' | 'hour' | 'day'>('second');
const invalidInput = ref(false);

// 入力値の検証
const validateInput = () => {
	const value = after.value;

	// 空の場合は許可
	if (!value) {
		invalidInput.value = false;
		return;
	}

	const numValue = parseInt(value);
	// パターンチェック
	const isValidPattern = /^[1-9][0-9]*$/.test(value);
	invalidInput.value = !isValidPattern || isNaN(numValue) || numValue <= 0;

	if (invalidInput.value) {
		after.value = '';
	}
};

// Input validation functions
const handleInput = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const value = input.value;

	// 数字以外の文字を削除
	const sanitizedValue = value.replace(/[^0-9]/g, '');
	// 先頭の0を削除
	const normalizedValue = sanitizedValue.replace(/^0+/, '') || '';
	after.value = normalizedValue;

	validateInput();
};

const showDetail = ref(false); // 常に折りたたんだ状態から始める
const summaryText = computed(() => {
	if (showDetail.value) {
		return i18n.ts.scheduledNoteDelete;
	}

	if (expiration.value === 'at') {
		return `${i18n.ts.scheduledNoteDeleteEnabled} (${formatDateTimeString(new Date(calcAt()), 'yyyy/MM/dd HH:mm')})`;
	} else {
		const afterValue = after.value ? parseInt(after.value) : 0;
		const time = unit.value === 'second' ? i18n.tsx._timeIn.seconds({ n: afterValue.toString() })
			: unit.value === 'minute' ? i18n.tsx._timeIn.minutes({ n: afterValue.toString() })
			: unit.value === 'hour' ? i18n.tsx._timeIn.hours({ n: afterValue.toString() })
			: i18n.tsx._timeIn.days({ n: afterValue.toString() });

		return `${i18n.ts.scheduledNoteDeleteEnabled} (${time})`;
	}
});

const beautifyAfter = (base: number) => {
	let time = base;

	if (time % 60 === 0) {
		unit.value = 'minute';
		time /= 60;
	}

	if (time % 60 === 0) {
		unit.value = 'hour';
		time /= 60;
	}

	if (time % 24 === 0) {
		unit.value = 'day';
		time /= 24;
	}

	after.value = time.toString();
};

// 初期値の設定
onMounted(() => {
	// デフォルト時間を先にセット
	if (prefer.s.defaultScheduledNoteDeleteTime > 0) {
		beautifyAfter(prefer.s.defaultScheduledNoteDeleteTime / 1000);
	}

	// モデル値の確認
	const hasModelValue = props.modelValue.deleteAt !== null || props.modelValue.deleteAfter !== null;

	// デフォルトの時限消滅設定が有効な場合
	if (prefer.s.defaultScheduledNoteDelete && !hasModelValue) {
		if (prefer.s.defaultScheduledNoteDeleteTime > 0) {
			expiration.value = 'after';
			// 初期状態として有効な状態をemit
			emit('update:modelValue', {
				deleteAt: null,
				deleteAfter: calcAfter(),
				isValid: true,
			});
		}
	} else if (hasModelValue) {
		// 既存のモデル値がある場合はそれを優先
		if (props.modelValue.deleteAt) {
			expiration.value = 'at';
			const deleteAt = new Date(props.modelValue.deleteAt);
			atDate.value = formatDateTimeString(deleteAt, 'yyyy-MM-dd');
			atTime.value = formatDateTimeString(deleteAt, 'HH:mm');
		} else if (props.modelValue.deleteAfter && props.modelValue.deleteAfter > 0) {
			expiration.value = 'after';
			beautifyAfter(props.modelValue.deleteAfter / 1000);
		}
	}
});
// showDetailの変更監視
watch(showDetail, (newValue) => {
	if (newValue) { // トグルを開いたとき
		if (!after.value || !calcAfter()) {
			// 値が未設定または無効な場合のみデフォルト時間をセット
			beautifyAfter(prefer.s.defaultScheduledNoteDeleteTime / 1000);
			emit('update:modelValue', {
				deleteAt: null,
				deleteAfter: calcAfter(),
				isValid: true,
			});
		}
	}
	// トグルを閉じるときは何もしない（入力値を保持）
});

const calcAt = () => {
	return new Date(`${atDate.value} ${atTime.value}`).getTime();
};

const calcAfter = () => {
	if (!after.value) return null;
	let base = parseInt(after.value);
	if (isNaN(base) || base <= 0) return null;

	switch (unit.value) {
		// @ts-expect-error fallthrough
		case 'day': base *= 24;
		// @ts-expect-error fallthrough
		case 'hour': base *= 60;
		// @ts-expect-error fallthrough
		case 'minute': base *= 60;
		// eslint-disable-next-line no-fallthrough
		case 'second': return base *= 1000;
		default: return null;
	}
};

// Computed properties for validation
const isEmpty = computed(() => {
	if (expiration.value === 'after') {
		return after.value === '';
	}
	return false;
});

const isOverOneYear = computed(() => {
	if (expiration.value === 'after') {
		const duration = calcAfter();
		return duration !== null && duration > 365 * 24 * 60 * 60 * 1000;
	}
	return false;
});

const isValid = computed(() => {
	if (expiration.value === 'after') {
		if (isEmpty.value) return false;
		if (invalidInput.value) return false;
		if (isOverOneYear.value) return false;

		const afterValue = parseInt(after.value);
		return !isNaN(afterValue) && afterValue > 0;
	}
	return true;
});

watch([expiration, atDate, atTime, after, unit, isValid], () => {
	const isValidTimeValue = isValidTime();

	emit('update:modelValue', {
		deleteAt: expiration.value === 'at' ? calcAt() : null,
		deleteAfter: expiration.value === 'after' ? calcAfter() : null,
		isValid: isValidTimeValue && !invalidInput.value,
	});
}, {
	deep: true,
});

const isValidTime = () => {
	if (expiration.value === 'at') {
		return calcAt() < Date.now() + (1000 * 60 * 60 * 24 * 365);
	} else {
		const afterMs = calcAfter();
		if (afterMs === null) return false;
		return afterMs < 1000 * 60 * 60 * 24 * 365;
	}
};
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 8px 0px;

	>span {
		opacity: 0.7;
	}

	>ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		>li {
			display: flex;
			margin: 8px 0;
			padding: 0;
			width: 100%;

			>.input {
				flex: 1;
			}

			>button {
				width: 32px;
				padding: 4px 0;
			}
		}
	}

	>section {
		>div {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				>div {
					flex-grow: 1;
				}

				>section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					>.input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}

.padding {
	padding: 8px 24px;
}

.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
}

.withAccent {
	color: var(--MI_THEME-accent);
}

.chevronOpening {
	transform: rotateX(180deg);
}
</style>
