import { Earcut } from './Earcut.js';

export function triangulate(boundsVec3) {
    let array = new Array(boundsVec3.length * 2);
    for (let i = 0, j = 0; i < boundsVec3.length; i++, j += 2) {
        array[j] = boundsVec3[i][0];
        array[j + 1] = boundsVec3[i][1];
    }
    return Earcut.triangulate(array);
}

export function exchange0And1( x ){
    /**
     * Function to swap 0s and 1s
     * 
     * This function is designed to return a number after applying a specific swapping rule based on the input number x.
     * The swapping rules are as follows:
     * - If the input is 0, return 1;
     * - If the input is 1, return 0;
     * - For any other input, return 2.
     * 
     * @param {number} x - The input value within set {0, 1, 2}.
     * @returns {number} - 1 if x is 0, 0 if x is 1, or 2 for any other input.
     */
    return x === 0 ? 1 : x === 1 ? 0 : 2;
    // return ( 3/2 * x * x - 5/2 * x + 1 )
}