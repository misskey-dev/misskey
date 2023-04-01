/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPageHeader_tabs from './MkPageHeader.tabs.vue';
const meta = {
	title: 'components/global/MkPageHeader/tabs',
	component: MkPageHeader_tabs,
} satisfies Meta<typeof MkPageHeader_tabs>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPageHeader_tabs,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkPageHeader_tabs v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPageHeader_tabs>;
export default meta;
