import { BlockPermutation, Dimension, Vector3 } from "@minecraft/server";
import { batch } from "../batch";

const defaultFillSettings = {
    tickInterval: 0,
    isFilling: () => true,
    setFilling: () => {},
    onSetBlock: () => {},
};

/**
* Fills blocks in the specified locations with the given block name.
* @param {Dimension} dimension The dimension to fill blocks in.
* @param {Vector3[]} blockLocations The locations of the blocks to fill.
* @param {string} blockName The name of the block to fill.
* @param {number} chunkSize Amount of blocks to fill in each batch.
* @param {Object} fillControlOptions Control options for the filling process.
* @param {number} [fillControlOptions.tickInterval] tick interval between each block fill.
* @param {() => boolean} [fillControlOptions.isFilling] Function that returns whether the filling process should continue.
* @param {(value: boolean) => void} [fillControlOptions.setFilling] Function that sets whether the filling process should continue.
* @param {(location: Vector3) => void} [fillControlOptions.onSetBlock] Function called when block placed.
* @param {() => void} [fillControlOptions.onComplete] Function called when the filling process is complete or got stopped.
* @returns {Promise<void>} A promise that resolves when the filling process is complete.
*/
export async function fill(
    dimension: Dimension,
    blockName: string,
    blockLocations: Vector3[], 
    chunkSize: number,
    fillSettings : { 
        tickInterval?: number
        isFilling?: () => boolean, 
        setFilling?: (value: boolean) => void,
        onSetBlock?: (location: Vector3) => void,
        onComplete?: () => void,
    } = {}
): Promise<void> {
    const options = { ...defaultFillSettings, ...fillSettings };
    
    const setBlock = (blockLocation: Vector3): void => {
        if (!options.isFilling()) return;
        
        const blockAtLocation = dimension.getBlock(blockLocation);
        if (!blockAtLocation) return;
        
        try {
            const permutation = BlockPermutation.resolve(blockName);
            blockAtLocation.setPermutation(permutation);
        } catch (error) {
            console.error(`Failed to fill block with ${blockName}: ${error}.`);
        }
        
        options.onSetBlock(blockLocation);
    };
    
    try {
        await batch(
            blockLocations, 
            chunkSize, 
            setBlock, 
            { 
                tickInterval: options.tickInterval,
                shouldContinue: options.isFilling,
                onComplete: options.onComplete,
            }
        );
        
        if (options.isFilling) {
            options.setFilling(false);
        }
    } catch (error) {
        console.error(`Failed to fill blocks: ${error}`);
    }
}