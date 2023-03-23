/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserPopup from './MkUserPopup.vue';
const meta = {
	title: 'components/MkUserPopup',
	component: MkUserPopup,
} satisfies Meta<typeof MkUserPopup>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserPopup,
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
			template: '<MkUserPopup v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserPopup>;
export default meta;
