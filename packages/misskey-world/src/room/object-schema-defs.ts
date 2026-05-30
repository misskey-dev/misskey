/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { a4Case_schema } from './objects/a4Case.schema.js';
import { aircon_schema } from './objects/aircon.schema.js';
import { allInOnePc_schema } from './objects/allInOnePc.schema.js';
import { aquarium_schema } from './objects/aquarium.schema.js';
import { aromaReedDiffuser_schema } from './objects/aromaReedDiffuser.schema.js';
import { banknote_schema } from './objects/banknote.schema.js';
import { beamLamp_schema } from './objects/beamLamp.schema.js';
import { bed_schema } from './objects/bed.schema.js';
import { blind_schema } from './objects/blind.schema.js';
import { book_schema } from './objects/book.schema.js';
import { books_schema } from './objects/books.schema.js';
import { boxWallShelf_schema } from './objects/boxWallShelf.schema.js';
import { cactusS_schema } from './objects/cactusS.schema.js';
import { cardboardBox_schema } from './objects/cardboardBox.schema.js';
import { ceilingFanLight_schema } from './objects/ceilingFanLight.schema.js';
import { chair_schema } from './objects/chair.schema.js';
import { clippedPicture_schema } from './objects/clippedPicture.schema.js';
import { coffeeCup_schema } from './objects/coffeeCup.schema.js';
import { colorBox_schema } from './objects/colorBox.schema.js';
import { cuboid_schema } from './objects/cuboid.schema.js';
import { cupNoodle_schema } from './objects/cupNoodle.schema.js';
import { curtain_schema } from './objects/curtain.schema.js';
import { custardPudding_schema } from './objects/custardPudding.schema.js';
import { descriptionPlate_schema } from './objects/descriptionPlate.schema.js';
import { desk_schema } from './objects/desk.schema.js';
import { desktopPc_schema } from './objects/desktopPc.schema.js';
import { djMixer_schema } from './objects/djMixer.schema.js';
import { djPlayer_schema } from './objects/djPlayer.schema.js';
import { ductRailSpotLights_schema } from './objects/ductRailSpotLights.schema.js';
import { ductTape_schema } from './objects/ductTape.schema.js';
import { electronicDisplayBoard_schema } from './objects/electronicDisplayBoard.schema.js';
import { emptyBento_schema } from './objects/emptyBento.schema.js';
import { energyDrink_schema } from './objects/energyDrink.schema.js';
import { envelope_schema } from './objects/envelope.schema.js';
import { facialTissue_schema } from './objects/facialTissue.schema.js';
import { glassCylinderPotPlant_schema } from './objects/glassCylinderPotPlant.schema.js';
import { handheldGameConsole_schema } from './objects/handheldGameConsole.schema.js';
import { hangingDuctRail_schema } from './objects/hangingDuctRail.schema.js';
import { hangingTShirt_schema } from './objects/hangingTShirt.schema.js';
import { icosahedron_schema } from './objects/icosahedron.schema.js';
import { ironFrameShelf_schema } from './objects/ironFrameShelf.schema.js';
import { ironFrameTable_schema } from './objects/ironFrameTable.schema.js';
import { issyoubin_schema } from './objects/issyoubin.schema.js';
import { keyboard_schema } from './objects/keyboard.schema.js';
import { laptopPc_schema } from './objects/laptopPc.schema.js';
import { largeMousepad_schema } from './objects/largeMousepad.schema.js';
import { lavaLamp_schema } from './objects/lavaLamp.schema.js';
import { letterCase_schema } from './objects/letterCase.schema.js';
import { lowPartitionBar_schema } from './objects/lowPartitionBar.schema.js';
import { miObjet_schema } from './objects/miObjet.schema.js';
import { milk_schema } from './objects/milk.schema.js';
import { miPlate_schema } from './objects/miPlate.schema.js';
import { miPlateDisplayed_schema } from './objects/miPlateDisplayed.schema.js';
import { mixer_schema } from './objects/mixer.schema.js';
import { monitor_schema } from './objects/monitor.schema.js';
import { monitorSpeaker_schema } from './objects/monitorSpeaker.schema.js';
import { monstera_schema } from './objects/monstera.schema.js';
import { mug_schema } from './objects/mug.schema.js';
import { newtonsCradle_schema } from './objects/newtonsCradle.schema.js';
import { openedCardboardBox_schema } from './objects/openedCardboardBox.schema.js';
import { pachira_schema } from './objects/pachira.schema.js';
import { petBottle_schema } from './objects/petBottle.schema.js';
import { piano_schema } from './objects/piano.schema.js';
import { pictureFrame_schema } from './objects/pictureFrame.schema.js';
import { pizza_schema } from './objects/pizza.schema.js';
import { plant_schema } from './objects/plant.schema.js';
import { plant2_schema } from './objects/plant2.schema.js';
import { poster_schema } from './objects/poster.schema.js';
import { powerStrip_schema } from './objects/powerStrip.schema.js';
import { radiometer_schema } from './objects/radiometer.schema.js';
import { randomBooks_schema } from './objects/randomBooks.schema.js';
import { recordPlayer_schema } from './objects/recordPlayer.schema.js';
import { rolledUpPoster_schema } from './objects/rolledUpPoster.schema.js';
import { roundRug_schema } from './objects/roundRug.schema.js';
import { router_schema } from './objects/router.schema.js';
import { siphon_schema } from './objects/siphon.schema.js';
import { snakeplant_schema } from './objects/snakeplant.schema.js';
import { sofa_schema } from './objects/sofa.schema.js';
import { speaker_schema } from './objects/speaker.schema.js';
import { speakerStand_schema } from './objects/speakerStand.schema.js';
import { spotLight_schema } from './objects/spotLight.schema.js';
import { sprayer_schema } from './objects/sprayer.schema.js';
import { stanchionPole_schema } from './objects/stanchionPole.schema.js';
import { steelRack_schema } from './objects/steelRack.schema.js';
import { stormGlass_schema } from './objects/stormGlass.schema.js';
import { tableSalt_schema } from './objects/tableSalt.schema.js';
import { tabletopCalendar_schema } from './objects/tabletopCalendar.schema.js';
import { tabletopDigitalClock_schema } from './objects/tabletopDigitalClock.schema.js';
import { tabletopFlag_schema } from './objects/tabletopFlag.schema.js';
import { tabletopGlassPictureFrame_schema } from './objects/tabletopGlassPictureFrame.schema.js';
import { tabletopIronFrameStand_schema } from './objects/tabletopIronFrameStand.schema.js';
import { tabletopLcdButtonsController_schema } from './objects/tabletopLcdButtonsController.schema.js';
import { tabletopPictureFrame_schema } from './objects/tabletopPictureFrame.schema.js';
import { tapestry_schema } from './objects/tapestry.schema.js';
import { tetrapod_schema } from './objects/tetrapod.schema.js';
import { tv_schema } from './objects/tv.schema.js';
import { twistedCubeObjet_schema } from './objects/twistedCubeObjet.schema.js';
import { usedTissue_schema } from './objects/usedTissue.schema.js';
import { wallCanvas_schema } from './objects/wallCanvas.schema.js';
import { wallClock_schema } from './objects/wallClock.schema.js';
import { wallGlassPictureFrame_schema } from './objects/wallGlassPictureFrame.schema.js';
import { wallMirror_schema } from './objects/wallMirror.schema.js';
import { wallMountSpotLight_schema } from './objects/wallMountSpotLight.schema.js';
import { wallShelf_schema } from './objects/wallShelf.schema.js';
import { wireBasket_schema } from './objects/wireBasket.schema.js';
import { wireNet_schema } from './objects/wireNet.schema.js';
import { woodRingFloorLamp_schema } from './objects/woodRingFloorLamp.schema.js';
import { woodRingsPendantLight_schema } from './objects/woodRingsPendantLight.schema.js';
import { woodSoundAbsorbingPanel_schema } from './objects/woodSoundAbsorbingPanel.schema.js';
import type { FurnitureSchemaDef } from './object.js';

export const FURNITURE_SCHEMA_DEFS = {
	a4Case: a4Case_schema,
	aircon: aircon_schema,
	allInOnePc: allInOnePc_schema,
	aquarium: aquarium_schema,
	aromaReedDiffuser: aromaReedDiffuser_schema,
	banknote: banknote_schema,
	beamLamp: beamLamp_schema,
	bed: bed_schema,
	blind: blind_schema,
	books: books_schema,
	boxWallShelf: boxWallShelf_schema,
	cactusS: cactusS_schema,
	cardboardBox: cardboardBox_schema,
	ceilingFanLight: ceilingFanLight_schema,
	chair: chair_schema,
	coffeeCup: coffeeCup_schema,
	colorBox: colorBox_schema,
	cuboid: cuboid_schema,
	cupNoodle: cupNoodle_schema,
	custardPudding: custardPudding_schema,
	desk: desk_schema,
	desktopPc: desktopPc_schema,
	djMixer: djMixer_schema,
	djPlayer: djPlayer_schema,
	ductRailSpotLights: ductRailSpotLights_schema,
	ductTape: ductTape_schema,
	electronicDisplayBoard: electronicDisplayBoard_schema,
	emptyBento: emptyBento_schema,
	energyDrink: energyDrink_schema,
	envelope: envelope_schema,
	facialTissue: facialTissue_schema,
	glassCylinderPotPlant: glassCylinderPotPlant_schema,
	hangingTShirt: hangingTShirt_schema,
	icosahedron: icosahedron_schema,
	ironFrameShelf: ironFrameShelf_schema,
	ironFrameTable: ironFrameTable_schema,
	issyoubin: issyoubin_schema,
	keyboard: keyboard_schema,
	laptopPc: laptopPc_schema,
	largeMousepad: largeMousepad_schema,
	lavaLamp: lavaLamp_schema,
	letterCase: letterCase_schema,
	miObjet: miObjet_schema,
	milk: milk_schema,
	miPlate: miPlate_schema,
	miPlateDisplayed: miPlateDisplayed_schema,
	mixer: mixer_schema,
	monitor: monitor_schema,
	monitorSpeaker: monitorSpeaker_schema,
	monstera: monstera_schema,
	mug: mug_schema,
	newtonsCradle: newtonsCradle_schema,
	openedCardboardBox: openedCardboardBox_schema,
	pachira: pachira_schema,
	petBottle: petBottle_schema,
	piano: piano_schema,
	pictureFrame: pictureFrame_schema,
	pizza: pizza_schema,
	plant: plant_schema,
	plant2: plant2_schema,
	poster: poster_schema,
	powerStrip: powerStrip_schema,
	radiometer: radiometer_schema,
	randomBooks: randomBooks_schema,
	recordPlayer: recordPlayer_schema,
	rolledUpPoster: rolledUpPoster_schema,
	roundRug: roundRug_schema,
	router: router_schema,
	siphon: siphon_schema,
	snakeplant: snakeplant_schema,
	sofa: sofa_schema,
	speaker: speaker_schema,
	speakerStand: speakerStand_schema,
	sprayer: sprayer_schema,
	steelRack: steelRack_schema,
	stormGlass: stormGlass_schema,
	tableSalt: tableSalt_schema,
	tabletopCalendar: tabletopCalendar_schema,
	tabletopDigitalClock: tabletopDigitalClock_schema,
	tabletopFlag: tabletopFlag_schema,
	tabletopGlassPictureFrame: tabletopGlassPictureFrame_schema,
	tabletopIronFrameStand: tabletopIronFrameStand_schema,
	tabletopPictureFrame: tabletopPictureFrame_schema,
	tabletopLcdButtonsController: tabletopLcdButtonsController_schema,
	tapestry: tapestry_schema,
	tetrapod: tetrapod_schema,
	tv: tv_schema,
	twistedCubeObjet: twistedCubeObjet_schema,
	usedTissue: usedTissue_schema,
	wallCanvas: wallCanvas_schema,
	wallClock: wallClock_schema,
	wallGlassPictureFrame: wallGlassPictureFrame_schema,
	wallMirror: wallMirror_schema,
	wallMountSpotLight: wallMountSpotLight_schema,
	wallShelf: wallShelf_schema,
	woodRingFloorLamp: woodRingFloorLamp_schema,
	woodRingsPendantLight: woodRingsPendantLight_schema,
	woodSoundAbsorbingPanel: woodSoundAbsorbingPanel_schema,
	hangingDuctRail: hangingDuctRail_schema,
	spotLight: spotLight_schema,
	lowPartitionBar: lowPartitionBar_schema,
	descriptionPlate: descriptionPlate_schema,
	stanchionPole: stanchionPole_schema,
	handheldGameConsole: handheldGameConsole_schema,
	curtain: curtain_schema,
	wireNet: wireNet_schema,
	clippedPicture: clippedPicture_schema,
	wireBasket: wireBasket_schema,
} as Record<string, FurnitureSchemaDef<any>>;

export function getFurnitureSchemaDef(type: string): FurnitureSchemaDef {
	const def = FURNITURE_SCHEMA_DEFS[type as keyof typeof FURNITURE_SCHEMA_DEFS];
	if (def == null) {
		throw new Error(`Unrecognized furniture type: ${type}`);
	}
	return def;
}
