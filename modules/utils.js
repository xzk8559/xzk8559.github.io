export function updateExtrudedModelsStatic(building, building_merge, renderNum, renderList, camera, scene, distance) {
    scene.add(building_merge);
    const zoom = Math.ceil(camera.position.y / 50);
    for (let i = 0; i < renderNum; i++) {
        const ib = renderList[i];
        const mesh = building[ib].getMesh();
        if (zoom < 6 && calculateLevel(mesh, camera, distance)) {
            scene.add(mesh);
        }
    }
}

export function updateExtrudedModelsAnimated(building, lut, renderNum, renderList, timeStep, maxIDRHis, vm, camera, scene, distance) {
    // const zoom = Math.ceil(camera.position.y / 50);
    for (let i = 0; i < renderNum; i++) {
        const ib = renderList[i];
        // LOD
        let mesh = building[ib].getMesh(0);
        building[ib].level = calculateLevel(mesh, camera, distance);
        if (building[ib].level == 1) mesh = building[ib].getMesh(1);

        if (timeStep < mesh.userData.parent.his.length && mesh.userData.parent.his.length > 1) {
            updateMeshAttributesForAnimation(
                vm.switch_dis, vm.switch_col, building[ib].level, 
                lut, mesh, timeStep, vm.slider_amp, maxIDRHis
            );
        }
        scene.add(mesh);
        mesh.visible = true;
    }
}
function updateMeshAttributesForAnimation(dis, col, level, lut, mesh, timeStep, sliderAmp, maxIDRHis) {
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;

    if (level == 1) {
        for (let i = 0; i <= mesh.userData.parent.floor; i++) {
            const interpolationIndex = i / mesh.userData.parent.floor;
            if (dis) {
                const displacement = calculateDisplacement(mesh.userData.parent.his, timeStep, sliderAmp, maxIDRHis, interpolationIndex);
                applyDisplacement(mesh, i, mesh.userData.parent.pointCount, displacement);
            }
            if (col) {
                const colorInterpolation = calculateColorInterpolation(mesh.userData.parent.his, timeStep, maxIDRHis, lut);
                applyColorChange(mesh, i, mesh.userData.parent.pointCount, colorInterpolation, interpolationIndex);
    
            }
        }
    } else {
        if (col) {
            const colorInterpolation = calculateColorInterpolation(mesh.userData.parent.his, timeStep, maxIDRHis, lut);
            applyColorChange(mesh, 0, mesh.userData.parent.pointCount, colorInterpolation, 1);
        }
    }

}

function calculateDisplacement(history, timeStep, sliderAmp, maxIDRHis, interpolationIndex) {
    const currentHis = history[timeStep];
    return currentHis * sliderAmp * interpolationIndex / maxIDRHis / 2; //Math.max(...max_IDR)
}

function applyDisplacement(mesh, floorIndex, pointCount, displacement) {
    for (let n = 0; n < pointCount; n++) {
        mesh.geometry.attributes.position.array[(floorIndex * pointCount + n) * 3] = mesh.userData.parent.bounds[n][0] + displacement;
    }
}

function calculateColorInterpolation(history, timeStep, maxIDRHis, lut) {
    // const temp = 8.0; // old
    const temp = 50; // v20240713
    const currentHis = history[timeStep];
    // return lut.getColor( Math.abs(currentHis) / maxIDRHis );
    return lut.getColor( Math.abs(currentHis) / temp );
}

function applyColorChange(mesh, floorIndex, pointCount, colorInterpolation, interpolationIndex) {
    const COLOR_OCCLUSION_FACTOR = 0.1;
    const occlusion = (1 - interpolationIndex) * COLOR_OCCLUSION_FACTOR;
    for (let n = 0; n < pointCount; n++) {
        mesh.geometry.attributes.color.array[(floorIndex * pointCount + n) * 3] = colorInterpolation.r - occlusion;
        mesh.geometry.attributes.color.array[(floorIndex * pointCount + n) * 3 + 1] = colorInterpolation.g - occlusion;
        mesh.geometry.attributes.color.array[(floorIndex * pointCount + n) * 3 + 2] = colorInterpolation.b - occlusion;
    }
}

function calculateLevel(object, camera, distance) {
    let x2 = Math.pow(object.geometry.attributes.position.array[0] - camera.position.x, 2);
    let y2 = Math.pow(object.geometry.attributes.position.array[1] - camera.position.y, 2);
    let z2 = Math.pow(object.geometry.attributes.position.array[2] - camera.position.z, 2);
    let d2 = Math.pow( distance, 2 )
    if ( (x2 + y2 + z2) < d2 ) {
        if ( (x2 + y2 + z2) < d2/2.25 ) {
            return 1
        }
        return 0
    }
}