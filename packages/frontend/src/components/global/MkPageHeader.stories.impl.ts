/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkPageHeader from './MkPageHeader.vue';
export const Empty = {
	render(args) {
		return {
			components: {
				MkPageHeader,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkPageHeader v-bind="props" />',
		};
	},
	args: {
		static: true,
		tabs: [],
	},
	parameters: {
		layout: 'centered',
		chromatic: {
			/* This component has animations that are implemented with JavaScript. So it's unstable to take a snapshot. */
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const OneTab = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'sometabkey',
		tabs: [
			{
				key: 'sometabkey',
				title: 'Some Tab Title',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const Icon = {
	...OneTab,
	args: {
		...OneTab.args,
		tabs: [
			{
				...OneTab.args.tabs[0],
				icon: 'ti ti-home',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const IconOnly = {
	...Icon,
	args: {
		...Icon.args,
		tabs: [
			{
				...Icon.args.tabs[0],
				title: undefined,
				iconOnly: true,
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const SomeTabs = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'princess',
		tabs: [
			{
				key: 'princess',
				title: 'Princess',
				icon: 'ti ti-crown',
			},
			{
				key: 'fairy',
				title: 'Fairy',
				icon: 'ti ti-snowflake',
			},
			{
				key: 'angel',
				title: 'Angel',
				icon: 'ti ti-feather',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
