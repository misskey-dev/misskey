/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMenu from './MkMenu.vue';
const meta = {
	title: 'components/MkMenu',
	component: MkMenu,
} satisfies Meta<typeof MkMenu>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMenu,
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
			template: '<MkMenu v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMenu>;
export default meta;
