/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTab from './MkTab.vue';
const meta = {
	title: 'components/MkTab',
	component: MkTab,
} satisfies Meta<typeof MkTab>;
export const Default = {
	render(args) {
		return {
			components: {
				MkTab,
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
			template: '<MkTab v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTab>;
export default meta;
