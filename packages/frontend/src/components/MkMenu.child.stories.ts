/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMenu_child from './MkMenu.child.vue';
const meta = {
	title: 'components/MkMenu.child',
	component: MkMenu_child,
} satisfies Meta<typeof MkMenu_child>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMenu_child,
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
			template: '<MkMenu_child v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMenu_child>;
export default meta;
