// displacementUtils.js
// Utility functions for working with displacement textures

// 缓存计算结果
const displacementCache = new Map();
// 上次更新时间
let lastUpdateTime = 0;
// 更新间隔（毫秒）
const UPDATE_INTERVAL = 100; // 100ms

/**
 * Calculate the displacement value for a building at a specific time step
 *
 * @param {Object} chunkMesh - The chunk mesh containing the building
 * @param {Object} floorIndexInfo - Object containing floor index information (start, end, count)
 * @param {Number} timeStep - Current animation time step
 * @param {Boolean} forceUpdate - Force update regardless of throttling
 * @returns {Object} Object containing displacement and drift values
 */
export function calculateDisplacement(chunkMesh, floorIndexInfo, timeStep, forceUpdate = false) {
    if (!chunkMesh || !chunkMesh.material || !chunkMesh.material.uniforms || !floorIndexInfo) {
        return { topDisplacement: 0, maxDrift: 0 };
    }

    // 生成缓存键
    const cacheKey = `${chunkMesh.uuid}_${floorIndexInfo.start}_${floorIndexInfo.end}_${timeStep}`;

    // 检查是否需要节流
    const now = performance.now();
    const shouldThrottle = !forceUpdate && (now - lastUpdateTime < UPDATE_INTERVAL);

    // 如果在节流期间内且缓存中有值，直接返回缓存的值
    if (shouldThrottle && displacementCache.has(cacheKey)) {
        return displacementCache.get(cacheKey);
    }

    // 更新最后计算时间
    lastUpdateTime = now;

    const material = chunkMesh.material;
    const uniforms = material.uniforms;

    // Get the displacement texture
    const displacementMap = uniforms.uDisplacementMap.value;
    if (!displacementMap || !displacementMap.image) {
        return { topDisplacement: 0, maxDrift: 0 };
    }

    // Find the maximum absolute drift value across all floors of this building
    // Find the displacement value of the top floor (largest idx) of this building
    let maxDrift = 0;
    let topDisplacement = 0;

    // 计算需要采样楼层的x坐标范围，不含base（0-displacement）
    // e.g. startFloorIndex=10, endFloorIndex=17
    // storeyCount = 17 - 10 + 1 = 8
    const startFloorIndex = floorIndexInfo.start;
    const endFloorIndex = floorIndexInfo.end;
    const storeyCount = endFloorIndex - startFloorIndex + 1; // +1 for inclusive range

    // 循环读取每个楼层的像素数据
    const pixelsData = sampleTextureRegion(
        displacementMap,
        startFloorIndex, endFloorIndex,
        timeStep,
    );
    // console.log(storeyCount);
    // console.log(pixelsData);

    if (pixelsData) {
        // 处理所有楼层的像素数据
        for (let i = 0; i < storeyCount; i++) {
            const pixelData = pixelsData[i];
            if (pixelData) {
                // Apply the same normalization as in the shader
                let drift = pixelData.g * 2.0 - 1.0; // Normalize from [0,1] -> [-1,1]
                drift *=  1.013; // mm

                // Calculate absolute drift value
                const absDrift = Math.abs(drift);

                // If this is the maximum absolute drift value so far, store it
                if (absDrift > maxDrift) {
                    maxDrift = absDrift;
                }
                // console.log(pixelData.r);

                // 如果是顶层（最后一个楼层），存储其位移值
                if (i === storeyCount-1) {
                    topDisplacement = pixelData.r * 2.0 - 1.0; // Normalize from [0,1] -> [-1,1]
                    topDisplacement *= 12.705; // mm
                }
            }
        }
    }

    // 缓存结果
    const result = {
        topDisplacement: topDisplacement,
        maxDrift: maxDrift,
    };

    // 将结果存入缓存
    displacementCache.set(cacheKey, result);

    // 限制缓存大小，防止内存泄漏
    if (displacementCache.size > 1000) {
        // 删除最早的条目
        const firstKey = displacementCache.keys().next().value;
        displacementCache.delete(firstKey);
    }

    return result;
}

// 缓存Canvas对象以避免重复创建
let samplerCanvas = null;
let samplerCtx = null;

/**
 * Sample a single pixel from a texture for a specific floor
 *
 * @param {THREE.Texture} texture - The texture to sample
 * @param {Number} floorIndex - The floor index to sample
 * @param {Number} y - Y coordinate for the canvas
 * @returns {Object|null} Pixel data object or null if sampling failed
 */
function sampleTexturePixel(texture, x, y) {
    if (!texture || !texture.image) {
        return null;
    }

    // 创建或重用Canvas
    if (!samplerCanvas) {
        samplerCanvas = document.createElement('canvas');
        samplerCtx = samplerCanvas.getContext('2d', { willReadFrequently: true });
    }

    // 只有当Canvas尺寸与纹理不匹配时才调整大小
    if (samplerCanvas.width !== texture.image.width ||
        samplerCanvas.height !== texture.image.height) {
        samplerCanvas.width = texture.image.width;
        samplerCanvas.height = texture.image.height;
        // 重新绘制纹理到Canvas
        samplerCtx.drawImage(texture.image, 0, 0);
    }

    try {
        // 读取单个像素数据
        const imageData = samplerCtx.getImageData(x, y, 1, 1);
        const data = imageData.data;

        return {
            r: data[0] / 255,
            g: data[1] / 255,
        };
    } catch (e) {
        console.error('Error sampling texture pixel:', e);
        return null;
    }
}

/**
 * Sample multiple pixels from a texture in a region by looping through individual floors
 *
 * @param {THREE.Texture} texture - The texture to sample
 * @param {Number} startFloorIndex - Start floor index
 * @param {Number} endFloorIndex - End floor index
 * @param {Number} y - Y coordinate for the canvas
 * @returns {Array|null} Array of pixel data objects or null if sampling failed
 */
function sampleTextureRegion(texture, startFloorIndex, endFloorIndex, y) {
    if (!texture || !texture.image) {
        return null;
    }

    const storeyCount = endFloorIndex - startFloorIndex + 1; // 17-10+1=8
    const result = new Array(storeyCount);

    try {
        // 循环采样每个楼层的像素
        for (let i = 0; i < storeyCount; i++) { // i = 0...7
            const floorIndex = startFloorIndex + i; // floorIndex = 10...17
            result[i] = sampleTexturePixel(texture, floorIndex, y);
        }

        return result;
    } catch (e) {
        console.error('Error sampling texture region:', e);
        return null;
    }
}

/**
 * Find the chunk mesh containing a specific building
 *
 * @param {Object} chunkManager - The chunk manager
 * @param {String} chunkKey - The chunk key
 * @returns {THREE.Mesh|null} The chunk mesh or null if not found
 */
export function findChunkMesh(chunkManager, chunkKey) {
    if (!chunkManager || !chunkKey || !chunkManager.chunks[chunkKey]) {
        return null;
    }

    const chunkInfo = chunkManager.chunks[chunkKey];
    return chunkInfo.loaded ? chunkInfo.mesh : null;
}
