/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserCardMini from './MkUserCardMini.vue';
const meta = {
	title: 'components/MkUserCardMini',
	component: MkUserCardMini,
} satisfies Meta<typeof MkUserCardMini>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserCardMini,
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
			template: '<MkUserCardMini v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserCardMini>;
export default meta;
