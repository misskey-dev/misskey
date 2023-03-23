/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCaptcha from './MkCaptcha.vue';
const meta = {
	title: 'components/MkCaptcha',
	component: MkCaptcha,
} satisfies Meta<typeof MkCaptcha>;
export const Default = {
	render(args) {
		return {
			components: {
				MkCaptcha,
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
			template: '<MkCaptcha v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCaptcha>;
export default meta;
