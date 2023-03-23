/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPopupMenu from './MkPopupMenu.vue';
const meta = {
	title: 'components/MkPopupMenu',
	component: MkPopupMenu,
} satisfies Meta<typeof MkPopupMenu>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPopupMenu,
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
			template: '<MkPopupMenu v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPopupMenu>;
export default meta;
