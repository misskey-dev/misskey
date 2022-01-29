import * as Misskey from 'misskey-js';
import { Ref } from 'vue';

export type MenuAction = (ev: MouseEvent) => void;

export type MenuDivider = null;
export type MenuNull = undefined;
export type MenuLabel = { type: 'label', text: string };
export type MenuLink = { type: 'link', to: string, text: string, icon?: string, indicate?: boolean, avatar?: Misskey.entities.User };
export type MenuA = { type: 'a', href: string, target?: string, download?: string, text: string, icon?: string, indicate?: boolean };
export type MenuUser = { type: 'user', user: Misskey.entities.User, active?: boolean, indicate?: boolean, action: MenuAction };
export type MenuSwitch = { type: 'switch', ref: Ref<boolean>, text: string, disabled?: boolean };
export type MenuButton = { type?: 'button', text: string, icon?: string, indicate?: boolean, danger?: boolean, active?: boolean, avatar?: Misskey.entities.User; action: MenuAction };

export type MenuPending = { type: 'pending' };

type OuterMenuItem = MenuDivider | MenuNull | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton;
type OuterPromiseMenuItem = Promise<MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton>;
export type MenuItem = OuterMenuItem | OuterPromiseMenuItem;
export type InnerMenuItem = MenuDivider | MenuPending | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton;
