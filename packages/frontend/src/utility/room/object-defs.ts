/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { aircon } from './objects/aircon.js';
import { aquarium } from './objects/aquarium.js';
import { banknote } from './objects/banknote.js';
import { bed } from './objects/bed.js';
import { blind } from './objects/blind.js';
import { book } from './objects/book.js';
import { cactusS } from './objects/cactusS.js';
import { cardboardBox } from './objects/cardboardBox.js';
import { ceilingFanLight } from './objects/ceilingFanLight.js';
import { chair } from './objects/chair.js';
import { colorBox } from './objects/colorBox.js';
import { cupNoodle } from './objects/cupNoodle.js';
import { desk } from './objects/desk.js';
import { ductTape } from './objects/ductTape.js';
import { energyDrink } from './objects/energyDrink.js';
import { facialTissue } from './objects/facialTissue.js';
import { keyboard } from './objects/keyboard.js';
import { lavaLamp } from './objects/lavaLamp.js';
import { letterCase } from './objects/letterCase.js';
import { milk } from './objects/milk.js';
import { monitor } from './objects/monitor.js';
import { monstera } from './objects/monstera.js';
import { mug } from './objects/mug.js';
import { openedCardboardBox } from './objects/openedCardboardBox.js';
import { pachira } from './objects/pachira.js';
import { plant } from './objects/plant.js';
import { plant2 } from './objects/plant2.js';
import { powerStrip } from './objects/powerStrip.js';
import { roundRug } from './objects/roundRug.js';
import { snakeplant } from './objects/snakeplant.js';
import { steelRack } from './objects/steelRack.js';
import { tabletopCalendar } from './objects/tabletopCalendar.js';
import { tabletopDigitalClock } from './objects/tabletopDigitalClock.js';
import { tv } from './objects/tv.js';
import { wallClock } from './objects/wallClock.js';
import { woodSoundAbsorbingPanel } from './objects/woodSoundAbsorbingPanel.js';

export const OBJECT_DEFS = [
	aircon,
	aquarium,
	banknote,
	bed,
	blind,
	book,
	cactusS,
	cardboardBox,
	ceilingFanLight,
	chair,
	colorBox,
	cupNoodle,
	desk,
	ductTape,
	energyDrink,
	facialTissue,
	keyboard,
	lavaLamp,
	letterCase,
	milk,
	monitor,
	monstera,
	mug,
	openedCardboardBox,
	pachira,
	plant,
	plant2,
	powerStrip,
	roundRug,
	snakeplant,
	steelRack,
	tabletopCalendar,
	tabletopDigitalClock,
	tv,
	wallClock,
	woodSoundAbsorbingPanel,
];

export function getObjectDef(type: string): typeof OBJECT_DEFS[number] {
	const def = OBJECT_DEFS.find(x => x.id === type);
	if (def == null) {
		throw new Error(`Unrecognized object type: ${type}`);
	}
	return def;
}
