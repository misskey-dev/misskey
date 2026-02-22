/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { a4Case } from './objects/a4Case.js';
import { aircon } from './objects/aircon.js';
import { aquarium } from './objects/aquarium.js';
import { aromaReadDiffuser } from './objects/aromaReadDiffuser.js';
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
import { mixer } from './objects/mixer.js';
import { monitor } from './objects/monitor.js';
import { monstera } from './objects/monstera.js';
import { mug } from './objects/mug.js';
import { openedCardboardBox } from './objects/openedCardboardBox.js';
import { pachira } from './objects/pachira.js';
import { pc } from './objects/pc.js';
import { petBottle } from './objects/petBottle.js';
import { plant } from './objects/plant.js';
import { plant2 } from './objects/plant2.js';
import { powerStrip } from './objects/powerStrip.js';
import { rolledUpPoster } from './objects/rolledUpPoster.js';
import { roundRug } from './objects/roundRug.js';
import { router } from './objects/router.js';
import { snakeplant } from './objects/snakeplant.js';
import { speaker } from './objects/speaker.js';
import { steelRack } from './objects/steelRack.js';
import { tabletopCalendar } from './objects/tabletopCalendar.js';
import { tabletopDigitalClock } from './objects/tabletopDigitalClock.js';
import { tv } from './objects/tv.js';
import { wallClock } from './objects/wallClock.js';
import { wallShelf } from './objects/wallShelf.js';
import { woodSoundAbsorbingPanel } from './objects/woodSoundAbsorbingPanel.js';

export const OBJECT_DEFS = [
	a4Case,
	aircon,
	aquarium,
	aromaReadDiffuser,
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
	mixer,
	monitor,
	monstera,
	mug,
	openedCardboardBox,
	pachira,
	pc,
	petBottle,
	plant,
	plant2,
	powerStrip,
	rolledUpPoster,
	roundRug,
	router,
	snakeplant,
	speaker,
	steelRack,
	tabletopCalendar,
	tabletopDigitalClock,
	tv,
	wallClock,
	wallShelf,
	woodSoundAbsorbingPanel,
];

export function getObjectDef(type: string): typeof OBJECT_DEFS[number] {
	const def = OBJECT_DEFS.find(x => x.id === type);
	if (def == null) {
		throw new Error(`Unrecognized object type: ${type}`);
	}
	return def;
}
