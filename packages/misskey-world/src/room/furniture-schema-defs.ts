/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { a4Case_schema } from './furnitures/a4Case.schema.js';
import { aircon_schema } from './furnitures/aircon.schema.js';
import { allInOnePc_schema } from './furnitures/allInOnePc.schema.js';
import { aquarium_schema } from './furnitures/aquarium.schema.js';
import { aromaReedDiffuser_schema } from './furnitures/aromaReedDiffuser.schema.js';
import { banknote_schema } from './furnitures/banknote.schema.js';
import { beamLamp_schema } from './furnitures/beamLamp.schema.js';
import { bed_schema } from './furnitures/bed.schema.js';
import { blind_schema } from './furnitures/blind.schema.js';
import { book_schema } from './furnitures/book.schema.js';
import { books_schema } from './furnitures/books.schema.js';
import { boxWallShelf_schema } from './furnitures/boxWallShelf.schema.js';
import { cactusS_schema } from './furnitures/cactusS.schema.js';
import { cardboardBox_schema } from './furnitures/cardboardBox.schema.js';
import { ceilingFanLight_schema } from './furnitures/ceilingFanLight.schema.js';
import { chair_schema } from './furnitures/chair.schema.js';
import { clippedPicture_schema } from './furnitures/clippedPicture.schema.js';
import { coffeeCup_schema } from './furnitures/coffeeCup.schema.js';
import { colorBox_schema } from './furnitures/colorBox.schema.js';
import { cuboid_schema } from './furnitures/cuboid.schema.js';
import { cupNoodle_schema } from './furnitures/cupNoodle.schema.js';
import { curtain_schema } from './furnitures/curtain.schema.js';
import { custardPudding_schema } from './furnitures/custardPudding.schema.js';
import { descriptionPlate_schema } from './furnitures/descriptionPlate.schema.js';
import { desk_schema } from './furnitures/desk.schema.js';
import { desktopPc_schema } from './furnitures/desktopPc.schema.js';
import { djMixer_schema } from './furnitures/djMixer.schema.js';
import { djPlayer_schema } from './furnitures/djPlayer.schema.js';
import { ductRailSpotLights_schema } from './furnitures/ductRailSpotLights.schema.js';
import { ductTape_schema } from './furnitures/ductTape.schema.js';
import { electronicDisplayBoard_schema } from './furnitures/electronicDisplayBoard.schema.js';
import { emptyBento_schema } from './furnitures/emptyBento.schema.js';
import { energyDrink_schema } from './furnitures/energyDrink.schema.js';
import { envelope_schema } from './furnitures/envelope.schema.js';
import { facialTissue_schema } from './furnitures/facialTissue.schema.js';
import { glassCylinderPotPlant_schema } from './furnitures/glassCylinderPotPlant.schema.js';
import { handheldGameConsole_schema } from './furnitures/handheldGameConsole.schema.js';
import { hangingDuctRail_schema } from './furnitures/hangingDuctRail.schema.js';
import { hangingTShirt_schema } from './furnitures/hangingTShirt.schema.js';
import { icosahedron_schema } from './furnitures/icosahedron.schema.js';
import { ironFrameShelf_schema } from './furnitures/ironFrameShelf.schema.js';
import { ironFrameTable_schema } from './furnitures/ironFrameTable.schema.js';
import { issyoubin_schema } from './furnitures/issyoubin.schema.js';
import { keyboard_schema } from './furnitures/keyboard.schema.js';
import { laptopPc_schema } from './furnitures/laptopPc.schema.js';
import { largeMousepad_schema } from './furnitures/largeMousepad.schema.js';
import { lavaLamp_schema } from './furnitures/lavaLamp.schema.js';
import { letterCase_schema } from './furnitures/letterCase.schema.js';
import { lowPartitionBar_schema } from './furnitures/lowPartitionBar.schema.js';
import { miObjet_schema } from './furnitures/miObjet.schema.js';
import { milk_schema } from './furnitures/milk.schema.js';
import { miPlate_schema } from './furnitures/miPlate.schema.js';
import { miPlateDisplayed_schema } from './furnitures/miPlateDisplayed.schema.js';
import { mixer_schema } from './furnitures/mixer.schema.js';
import { monitor_schema } from './furnitures/monitor.schema.js';
import { monitorSpeaker_schema } from './furnitures/monitorSpeaker.schema.js';
import { monstera_schema } from './furnitures/monstera.schema.js';
import { mug_schema } from './furnitures/mug.schema.js';
import { newtonsCradle_schema } from './furnitures/newtonsCradle.schema.js';
import { openedCardboardBox_schema } from './furnitures/openedCardboardBox.schema.js';
import { pachira_schema } from './furnitures/pachira.schema.js';
import { petBottle_schema } from './furnitures/petBottle.schema.js';
import { piano_schema } from './furnitures/piano.schema.js';
import { pictureFrame_schema } from './furnitures/pictureFrame.schema.js';
import { pizza_schema } from './furnitures/pizza.schema.js';
import { plant_schema } from './furnitures/plant.schema.js';
import { plant2_schema } from './furnitures/plant2.schema.js';
import { poster_schema } from './furnitures/poster.schema.js';
import { powerStrip_schema } from './furnitures/powerStrip.schema.js';
import { radiometer_schema } from './furnitures/radiometer.schema.js';
import { randomBooks_schema } from './furnitures/randomBooks.schema.js';
import { recordPlayer_schema } from './furnitures/recordPlayer.schema.js';
import { rolledUpPoster_schema } from './furnitures/rolledUpPoster.schema.js';
import { roundRug_schema } from './furnitures/roundRug.schema.js';
import { router_schema } from './furnitures/router.schema.js';
import { siphon_schema } from './furnitures/siphon.schema.js';
import { snakeplant_schema } from './furnitures/snakeplant.schema.js';
import { sofa_schema } from './furnitures/sofa.schema.js';
import { speaker_schema } from './furnitures/speaker.schema.js';
import { speakerStand_schema } from './furnitures/speakerStand.schema.js';
import { spotLight_schema } from './furnitures/spotLight.schema.js';
import { sprayer_schema } from './furnitures/sprayer.schema.js';
import { stanchionPole_schema } from './furnitures/stanchionPole.schema.js';
import { steelRack_schema } from './furnitures/steelRack.schema.js';
import { stormGlass_schema } from './furnitures/stormGlass.schema.js';
import { tableSalt_schema } from './furnitures/tableSalt.schema.js';
import { tabletopCalendar_schema } from './furnitures/tabletopCalendar.schema.js';
import { tabletopDigitalClock_schema } from './furnitures/tabletopDigitalClock.schema.js';
import { tabletopFlag_schema } from './furnitures/tabletopFlag.schema.js';
import { tabletopGlassPictureFrame_schema } from './furnitures/tabletopGlassPictureFrame.schema.js';
import { tabletopIronFrameStand_schema } from './furnitures/tabletopIronFrameStand.schema.js';
import { tabletopLcdButtonsController_schema } from './furnitures/tabletopLcdButtonsController.schema.js';
import { tabletopPictureFrame_schema } from './furnitures/tabletopPictureFrame.schema.js';
import { tapestry_schema } from './furnitures/tapestry.schema.js';
import { tetrapod_schema } from './furnitures/tetrapod.schema.js';
import { tv_schema } from './furnitures/tv.schema.js';
import { twistedCubeObjet_schema } from './furnitures/twistedCubeObjet.schema.js';
import { usedTissue_schema } from './furnitures/usedTissue.schema.js';
import { wallCanvas_schema } from './furnitures/wallCanvas.schema.js';
import { wallClock_schema } from './furnitures/wallClock.schema.js';
import { wallGlassPictureFrame_schema } from './furnitures/wallGlassPictureFrame.schema.js';
import { wallMirror_schema } from './furnitures/wallMirror.schema.js';
import { wallMountSpotLight_schema } from './furnitures/wallMountSpotLight.schema.js';
import { wallShelf_schema } from './furnitures/wallShelf.schema.js';
import { wireBasket_schema } from './furnitures/wireBasket.schema.js';
import { wireNet_schema } from './furnitures/wireNet.schema.js';
import { woodRingFloorLamp_schema } from './furnitures/woodRingFloorLamp.schema.js';
import { woodRingsPendantLight_schema } from './furnitures/woodRingsPendantLight.schema.js';
import { woodSoundAbsorbingPanel_schema } from './furnitures/woodSoundAbsorbingPanel.schema.js';
import { haniwa_schema } from './furnitures/haniwa.schema.js';
import { ceilingFan_schema } from './furnitures/ceilingFan.schema.js';
import { downlight_schema } from './furnitures/downlight.schema.js';
import { kakejiku_schema } from './furnitures/kakejiku.schema.js';
import { herbarium_schema } from './furnitures/herbarium.schema.js';
import type { FurnitureSchemaDef } from './furniture.js';

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
	ceilingFan: ceilingFan_schema,
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
	haniwa: haniwa_schema,
	downlight: downlight_schema,
	kakejiku: kakejiku_schema,
	herbarium: herbarium_schema,
} as Record<string, FurnitureSchemaDef<any>>;

export function getFurnitureSchemaDef(type: string): FurnitureSchemaDef {
	const def = FURNITURE_SCHEMA_DEFS[type as keyof typeof FURNITURE_SCHEMA_DEFS];
	if (def == null) {
		throw new Error(`Unrecognized furniture type: ${type}`);
	}
	return def;
}
