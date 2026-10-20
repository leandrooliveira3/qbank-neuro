import {reconstructedArteries} from "./reconstructedArteries";
import {educationalVessels} from "./educationalVessels";
/** All reconstructions for atlas/inventory. Procedural station contrast retains
 * its separate, pre-existing arterial set; illustrative additions never extend it. */
export const reconstructedVessels=[...reconstructedArteries,...educationalVessels];
