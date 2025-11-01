<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkModal
		ref="modal"
		v-slot="{ type: modalType, maxHeight }"
		:zPriority="'high'"
		:anchorElement="anchorElement"
		:transparentBg="true"
		:returnFocusTo="returnFocusTo"
		@click="close"
		@close="onModalClose"
		@closed="onModalClosed"
	>
		<div
			class="_popup _shadow"
			:class="[$style.root, {
				[$style.asDrawer]: modalType === 'drawer',
				[$style.widthSpecified]: width != null,
			}]"
			:style="{
				'--width': width != null ? `${width}px` : 'auto',
				maxHeight: maxHeight ? `${maxHeight}px` : 'auto',
			}">
			<div :class="[$style.formRoot, { [$style.datetime]: type === 'datetime' }]">
				<div v-if="type === 'date' || type === 'datetime'" :class="$style.dateRoot">
					<div :class="$style.calendarRoot">
						<div :class="$style.calendarControls">
							<MkButton iconOnly @click="prevMonth"><i class="ti ti-chevron-left"></i></MkButton>
							<div>
								<input type="number" v-model.number="year" style="width: 4em; text-align: center;" />
								/
								<input type="number" v-model.number="month" style="width: 2em; text-align: center;" />
							</div>
							<MkButton iconOnly @click="nextMonth"><i class="ti ti-chevron-right"></i></MkButton>
						</div>
						<template v-if="isCalInvalid">
							<div :class="$style.calendarInvalid">{{ i18n.ts.calendarInvalidDateError }}</div>
						</template>
						<template v-else>
							<div :class="$style.calendarHeader">
								<div>{{ i18n.ts._weekdayShort.sunday }}</div>
								<div>{{ i18n.ts._weekdayShort.monday }}</div>
								<div>{{ i18n.ts._weekdayShort.tuesday }}</div>
								<div>{{ i18n.ts._weekdayShort.wednesday }}</div>
								<div>{{ i18n.ts._weekdayShort.thursday }}</div>
								<div>{{ i18n.ts._weekdayShort.friday }}</div>
								<div>{{ i18n.ts._weekdayShort.saturday }}</div>
							</div>
							<div v-for="date in calDateArray" :key="date.radioValue">
								<input
									type="radio"
									:class="$style.calendarDayRadio"
									:name="id"
									:id="`${id}-day-${date.radioValue}`"
									:disabled="date.disabled"
									:value="date.radioValue"
									v-model="dateValue"
								/>
								<label
									class="_button"
									:class="[$style.calendarDayLabel, {
										[$style.today]: date.isToday,
										[$style.saturday]: date.day === 6,
										[$style.sunday]: date.day === 0,
										[$style.notCurrentMonth]: !date.isCurrentMonth,
										[$style.initiallySelected]: date.isInitiallySelected,
										[$style.disabled]: date.disabled,
									}]"
									:for="`${id}-day-${date.radioValue}`"
								>{{ date.date.date }}</label>
							</div>
						</template>
					</div>
				</div>
				<div v-if="type === 'time' || type === 'datetime'" :class="$style.timeRoot">

				</div>
			</div>
		</div>
	</MkModal>
</template>

<script lang="ts" setup generic="F extends FormType">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { genId } from '@/utility/id.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import type { FormType, MkDateTimeInputDateObject, MkDateTimeInputTimeObject, MkDateTimeInputValue } from './MkDateTimeInput.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	type: F;
	initialValue: MkDateTimeInputValue<F> | null;
	min?: MkDateTimeInputValue<F>;
	max?: MkDateTimeInputValue<F>;
	width?: number;
	anchorElement?: HTMLElement | null;
	returnFocusTo?: HTMLElement | null;
}>();

const emit = defineEmits<{
	(ev: 'chosen', value: MkDateTimeInputValue<F> | null): void;
	(ev: 'closing'): void;
	(ev: 'closed'): void;
}>();

const fixedInitialValue = props.initialValue;

const id = genId();

const modal = useTemplateRef('modal');

function close() {
	modal.value?.close();
}

function onModalClose() {
	emit('closing');
}

function onModalClosed() {
	emit('closed');
}

const now = new Date();
const minDate = shallowRef<Date | null>(null);
const maxDate = shallowRef<Date | null>(null);
watch(() => props.min, (to) => {
	minDate.value = props.type !== 'time' && to != null ? new Date((to as MkDateTimeInputDateObject).year, (to as MkDateTimeInputDateObject).month - 1, (to as MkDateTimeInputDateObject).date) : null;
}, { immediate: true });
watch(() => props.max, (to) => {
	maxDate.value = props.type !== 'time' && to != null ? new Date((to as MkDateTimeInputDateObject).year, (to as MkDateTimeInputDateObject).month - 1, (to as MkDateTimeInputDateObject).date) : null;
}, { immediate: true });

//#region Calendar Controls
const year = ref((props.initialValue as MkDateTimeInputDateObject)?.year ?? now.getFullYear());
const month = ref((props.initialValue as MkDateTimeInputDateObject)?.month ?? now.getMonth() + 1);
const isCalInvalid = computed(() => {
	return month.value < 1 || month.value > 12;
});
function prevMonth() {
	if (month.value <= 1) {
		month.value = 12;
		year.value -= 1;
	} else {
		month.value--;
	}
}
function nextMonth() {
	if (month.value >= 12) {
		month.value = 1;
		year.value += 1;
	} else {
		month.value++;
	}
}
//#endregion

//#region Calendar Values
type CalendarValue = {
	radioValue: string;
	date: MkDateTimeInputDateObject;
	day: number;
	isToday: boolean;
	isCurrentMonth: boolean;
	isInitiallySelected: boolean;
	disabled: boolean;
};

function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear()
		&& date1.getMonth() === date2.getMonth()
		&& date1.getDate() === date2.getDate();
}

function isSameDateObject(date1: MkDateTimeInputDateObject, date2: MkDateTimeInputDateObject): boolean {
	return date1.year === date2.year
		&& date1.month === date2.month
		&& date1.date === date2.date;
}

function isDisabled(date: MkDateTimeInputDateObject): boolean {
	if (props.min == null && props.max == null) {
		return false;
	}

	const dateInstance = new Date(date.year, date.month - 1, date.date);

	if (minDate.value != null) {
		if (dateInstance < minDate.value) {
			return true;
		}
	}

	if (maxDate.value != null) {
		if (dateInstance > maxDate.value) {
			return true;
		}
	}

	return false;
}

const calDateArray = computed<CalendarValue[]>(() => {
	const dateArray: CalendarValue[] = [];

	const firstDay = new Date(year.value, month.value - 1, 1).getDay();
	const lastDate = new Date(year.value, month.value, 0).getDate();

	for (let i = firstDay; i > 0; i--) {
		// 前月の日付で埋める
		const dateInstance = new Date(year.value, month.value - 1, 0);
		dateInstance.setDate(dateInstance.getDate() - i + 1);
		const dayYear = dateInstance.getFullYear();
		const dayMonth = dateInstance.getMonth() + 1;
		const dayDate = dateInstance.getDate();
		const dateString = `${dayYear.toString().padStart(4, '0')}-${dayMonth.toString().padStart(2, '0')}-${dayDate.toString().padStart(2, '0')}`;

		dateArray.push({
			radioValue: dateString,
			date: { year: dayYear, month: dayMonth, date: dayDate },
			day: (firstDay - i) % 7,
			isCurrentMonth: false,
			isToday: isSameDay(dateInstance, now),
			isInitiallySelected: fixedInitialValue != null && isSameDateObject(fixedInitialValue as MkDateTimeInputDateObject, { year: dayYear, month: dayMonth, date: dayDate }),
			disabled: isDisabled({ year: dayYear, month: dayMonth, date: dayDate }),
		});
	}

	for (let i = 1; i <= lastDate; i++) {
		const dateInstance = new Date(year.value, month.value - 1, i);
		const dateString = `${year.value.toString().padStart(4, '0')}-${month.value.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;

		dateArray.push({
			radioValue: dateString,
			date: { year: year.value, month: month.value, date: i },
			day: (firstDay + i - 1) % 7,
			isCurrentMonth: true,
			isToday: isSameDay(dateInstance, now),
			isInitiallySelected: fixedInitialValue != null && isSameDateObject(fixedInitialValue as MkDateTimeInputDateObject, { year: year.value, month: month.value, date: i }),
			disabled: isDisabled({ year: year.value, month: month.value, date: i }),
		});
	}

	const remainingDays = 7 - (dateArray.length % 7);

	for (let i = 1; i <= remainingDays; i++) {
		// 翌月の日付で埋める
		const dateInstance = new Date(year.value, month.value, i);
		const dayYear = dateInstance.getFullYear();
		const dayMonth = dateInstance.getMonth() + 1;
		const dayDate = dateInstance.getDate();
		const dateString = `${dayYear.toString().padStart(4, '0')}-${dayMonth.toString().padStart(2, '0')}-${dayDate.toString().padStart(2, '0')}`;

		dateArray.push({
			radioValue: dateString,
			date: { year: dayYear, month: dayMonth, date: dayDate },
			day: (firstDay + lastDate + i - 1) % 7,
			isCurrentMonth: false,
			isToday: isSameDay(dateInstance, now),
			isInitiallySelected: fixedInitialValue != null && isSameDateObject(fixedInitialValue as MkDateTimeInputDateObject, { year: dayYear, month: dayMonth, date: dayDate }),
			disabled: isDisabled({ year: dayYear, month: dayMonth, date: dayDate }),
		});
	}

	return dateArray;
});
//#endregion

//#region Date Value
const dateValue = ref<string>((() => {
	if (props.initialValue == null) {
		return '';
	}
	if (props.type === 'date' || props.type === 'datetime') {
		const val = props.initialValue as MkDateTimeInputDateObject;
		return `${val.year.toString().padStart(4, '0')}-${val.month.toString().padStart(2, '0')}-${val.date.toString().padStart(2, '0')}`;
	}

	return '';
})());
const hourValue = ref<number>((() => {
	if (props.initialValue == null) {
		return 0;
	}
	if (props.type === 'time' || props.type === 'datetime') {
		const val = props.initialValue as MkDateTimeInputTimeObject;
		return val.hour;
	}

	return 0;
})());
const minuteValue = ref<number>((() => {
	if (props.initialValue == null) {
		return 0;
	}
	if (props.type === 'time' || props.type === 'datetime') {
		const val = props.initialValue as MkDateTimeInputTimeObject;
		return val.minute;
	}
	return 0;
})());
const valueObject = computed<MkDateTimeInputValue<F> | null>(() => {
	if (props.type === 'date') {
		if (dateValue.value) {
			const [yearStr, monthStr, dateStr] = dateValue.value.split('-');
			return {
				year: parseInt(yearStr, 10),
				month: parseInt(monthStr, 10),
				date: parseInt(dateStr, 10),
			} as MkDateTimeInputDateObject as MkDateTimeInputValue<F>;
		}
	} else if (props.type === 'time') {
		return {
			hour: hourValue.value,
			minute: minuteValue.value,
		} as MkDateTimeInputTimeObject as MkDateTimeInputValue<F>;
	} else if (props.type === 'datetime') {
		if (dateValue.value) {
			const [yearStr, monthStr, dateStr] = dateValue.value.split('-');
			return {
				year: parseInt(yearStr, 10),
				month: parseInt(monthStr, 10),
				date: parseInt(dateStr, 10),
				hour: hourValue.value,
				minute: minuteValue.value,
			} as MkDateTimeInputDateObject & MkDateTimeInputTimeObject as MkDateTimeInputValue<F>;
		}
	}

	return null;
});
//#endregion

watch(valueObject, (to) => {
	emit('chosen', to);
});
</script>

<style module lang="scss">
.root {
	padding: 24px;
	box-sizing: border-box;
	max-width: 100vw;
	min-width: 200px;
	overflow: auto;
	overscroll-behavior: contain;
	container-type: inline-size;
	position: relative;

	&:focus-visible {
		outline: none;
	}

	&:not(.asDrawer).widthSpecified {
		width: var(--width);
	}

	&:not(.asDrawer):not(.widthSpecified) {
		max-width: 400px;
	}

	&.asDrawer {
		max-width: 600px;
		margin: auto;
		padding: 24px 24px max(env(safe-area-inset-bottom, 0px), 24px);
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}

.formRoot {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--MI-margin);
}

@container (min-width: 400px) {
	.formRoot.datetime {
		grid-template-columns: 2fr 1fr;
	}
}

.calendarRoot {
	display: grid;
	grid-template-columns: repeat(7, 32px);
	grid-template-rows: auto auto repeat(6, 32px);
	text-align: center;
	width: max-content;
	margin: 0 auto;
}

.calendarInvalid {
	grid-column: 1 / -1;
	grid-row: 2 / -1;
	color: var(--MI_THEME-error);
	text-align: center;
	font-size: 0.9em;
	font-weight: bold;
}

.calendarControls {
	grid-column: 1 / -1;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--MI-margin);
	font-weight: bold;
	font-size: 1.1em;
}

.calendarHeader {
	grid-column: 1 / -1;
	display: grid;
	grid-template-columns: repeat(7, 32px);
	text-align: center;
	font-weight: bold;
	font-size: 0.8em;
	margin-bottom: 4px;
}

.calendarDayRadio {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	border: 0;
}

.calendarDayLabel {
	position: relative;
	display: block;
	width: 32px;
	height: 32px;
	line-height: 32px;
	text-align: center;
	cursor: pointer;

	&.today {
		font-weight: bold;
	}

	&.saturday {
		color: #2563eb;
	}

	&.sunday {
		color: #dc2626;
	}

	&.notCurrentMonth {
		color: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
	}

	&.disabled {
		opacity: 0.3;
		cursor: not-allowed;

		&:after {
			content: '';
			position: absolute;
			width: 2px;
			height: 32px;
			background: var(--MI_THEME-fg);
			top: 0;
			left: 50%;
			transform: translateX(-50%) rotate(45deg);
		}
	}

	&:before {
		content: '';
		display: block;
		width: 32px;
		height: 32px;
		box-sizing: border-box;
		border-width: 2px;
		border-style: solid;
		border-color: transparent;
		border-radius: 50%;
		background-color: transparent;
		position: absolute;
		z-index: -1;
		top: 0;
		left: 0;
	}

	&.initiallySelected::before {
		border-color: color(from var(--MI_THEME-accent) srgb r g b / 0.5);
		border-style: dashed;
	}

	&.today::before {
		border-color: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
	}

	&:hover::before {
		background: var(--MI_THEME-panelHighlight);
	}
}

.calendarDayRadio:checked + .calendarDayLabel {
	color: var(--MI_THEME-fgOnAccent);

	&:before {
		background: var(--MI_THEME-accent);
		border-color: var(--MI_THEME-accent);
		border-style: solid;
	}
}
</style>
