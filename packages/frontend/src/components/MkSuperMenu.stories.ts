/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSuperMenu from './MkSuperMenu.vue';
const meta = {
	title: 'components/MkSuperMenu',
	component: MkSuperMenu,
} satisfies Meta<typeof MkSuperMenu>;
export const Default = {
	render(args) {
		return {
			components: {
				MkSuperMenu,
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
			template: '<MkSuperMenu v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSuperMenu>;
export default meta;
