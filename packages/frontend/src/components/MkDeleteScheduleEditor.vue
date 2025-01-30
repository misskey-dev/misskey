<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="[$style.root, { [$style.padding]: !afterOnly }]">
		<div v-if="!afterOnly" :class="[$style.label, { [$style.withAccent]: !showDetail }]"
			@click="showDetail = !showDetail"><i class="ti" :class="showDetail ? 'ti-chevron-up' : 'ti-chevron-down'"></i> {{
				summaryText }}</div>
		<MkInfo v-if="!isValid" warn>
			<template v-if="isEmpty">
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
					<MkInput v-model="after" small type="text" class="input" pattern="[0-9]*" @input="handleInput"
						@keypress="validateKeyPress">
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
import { computed, ref, watch } from 'vue';
import MkInput from './MkInput.vue';
import MkSelect from './MkSelect.vue';
import MkInfo from './MkInfo.vue';
import { formatDateTimeString } from '@/scripts/format-time-string.js';
import { addTime } from '@/scripts/time.js';
import { defaultStore } from '@/store.js';
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

// Input validation functions
const handleInput = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const value = input.value;
	// 数字以外の文字を削除
	const sanitizedValue = value.replace(/[^0-9]/g, '');
	// 先頭の0を削除
	const normalizedValue = sanitizedValue.replace(/^0+/, '') || '';
	after.value = normalizedValue;
};

const validateKeyPress = (event: KeyboardEvent) => {
	// 数字以外のキー入力をブロック
	if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
		event.preventDefault();
	}

	// 値が空で0を入力しようとする場合をブロック
	if (event.key === '0' && (!after.value || after.value === '0')) {
		event.preventDefault();
	}
};

const showDetail = ref(!defaultStore.state.defaultScheduledNoteDelete);
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

if (defaultStore.state.defaultScheduledNoteDeleteTime > 0) {
	beautifyAfter(defaultStore.state.defaultScheduledNoteDeleteTime / 1000);
}

if (props.modelValue.deleteAt) {
	expiration.value = 'at';
	const deleteAt = new Date(props.modelValue.deleteAt);
	atDate.value = formatDateTimeString(deleteAt, 'yyyy-MM-dd');
	atTime.value = formatDateTimeString(deleteAt, 'HH:mm');
} else if (typeof props.modelValue.deleteAfter === 'number' && props.modelValue.deleteAfter > 0) {
	expiration.value = 'after';
	beautifyAfter(props.modelValue.deleteAfter / 1000);
}

const calcAt = () => {
	return new Date(`${atDate.value} ${atTime.value}`).getTime();
};

const calcAfter = () => {
	if (!after.value) return null;
	let base = parseInt(after.value);
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

const isValidTime = () => {
	if (expiration.value === 'at') {
		return calcAt() < Date.now() + (1000 * 60 * 60 * 24 * 365);
	} else {
		const afterMs = calcAfter();
		if (afterMs === null) return false;
		return afterMs < 1000 * 60 * 60 * 24 * 365;
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

const isValid = computed(() => !isEmpty.value && !isOverOneYear.value);

watch([expiration, atDate, atTime, after, unit, isValid], () => {
	const isValidTimeValue = isValidTime();

	emit('update:modelValue', {
		deleteAt: expiration.value === 'at' ? calcAt() : null,
		deleteAfter: expiration.value === 'after' ? calcAfter() : null,
		isValid: isValidTimeValue && !isEmpty.value,
	});
}, {
	deep: true,
});
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
