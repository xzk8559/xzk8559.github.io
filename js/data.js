// js/data.js

var cameraControls = {
    x_set: 0,
    y_set: 0,
    isReset: 0
};

var timeControls = {
isReset: 1
};

var aniControls = {
animation: 0,
velocity: 1,
amplitude: 1
};

var table_attr = {
structure: {
    needsUpdate: 1,
    isInteractive: 0,
    attributes: {
    bid: { name: "ID", value: null },
    county: { name: "county", value: null },
    town: { name: "town", value: null },
    builtYear: { name: "year of built", value: null },
    height: { name: "height", value: null },
    floor: { name: "floor", value: null },
    coordinate: { name: "coordinate", value: null },
    circleNum: { name: "circle", value: null },
    floorArea: { name: "floor area", value: null },
    buildArea: { name: "building area", value: null },
    boundSp: { name: "bounding sphere radius", value: null },
    triangles: { name: "triangles", value: null }
    }
},
earthquake: {
    needsUpdate: 1,
    attributes: {
    eid: { name: "ID", value: null },
    pga: { name: "PGA", value: null },
    duration: { name: "duration", value: null },
    cav: { name: "CAV", value: null }
    }
},
response: {
    history: {
    needsUpdate: 1
    }
}
};

// If you have any additional global data objects or constants, place them here as well.



// // Control States
// const cameraControls = {
//     x_set: 0,
//     y_set: 0,
//     isReset: false
// };

// const timeControls = {
//     isReset: true
// };

// const aniControls = {
//     animation: false,
//     velocity: 1,
//     amplitude: 1
// };

// // Table Attributes
// const table_attr = {
//     structure: {
//         needsUpdate: true,
//         isInteractive: false,
//         attributes: {
//             bid: { name: 'ID', value: null },
//             county: { name: 'County', value: null },
//             town: { name: 'Town', value: null },
//             builtYear: { name: 'Year Built', value: null },
//             height: { name: 'Height', value: null },
//             floor: { name: 'Floor', value: null },
//             coordinate: { name: 'Coordinate', value: null },
//             circleNum: { name: 'Circle', value: null },
//             floorArea: { name: 'Floor Area', value: null },
//             buildArea: { name: 'Building Area', value: null },
//             boundSp: { name: 'Bounding Sphere Radius', value: null },
//             triangles: { name: 'Triangles', value: null },
//         }
//     },
//     earthquake: {
//         needsUpdate: 1,
//         attributes: {
//             eid: { name: 'ID', value: null },
//             pga: { name: 'PGA', value: null },
//             duration: { name: 'Duration', value: null },
//             cav: { name: 'CAV', value: null }
//         }
//     },
//     response: {
//         history: {
//             needsLoad: true
//         }
//     }
// };

// // Initial Data for Vue Instance
// const appData = {
//     drawer: false,
//     expandedPanels: [0, 1],
//     activePage: 0,
//     show: false,
//     aside_width: "30%",
//     sliderX: cameraControls.x_set,
//     sliderY: cameraControls.y_set,
//     cameraX: 0,
//     cameraY: 0,
//     eqStr: '',
//     eqHistory: [0, 0, 0, 0, 0, 0, -1, -1, 3, 3, -2.5, -2.5, 1.5, 1.5, -1, -1, 3, 3, -2.5, -2.5, 1.5, 1.5, -1.8, -1.8, 1, 1, -1, -1, 0, 0, 0, 0, 0, 0],
//     timeStep: 0,
//     maxTimeStep: 120,
//     switch_anim: aniControls.animation,
//     aniDisabled: true,
//     switchInteract: table_attr.structure.isInteractive,
//     sliderVel: aniControls.velocity,
//     sliderVelBackup: aniControls.velocity,
//     aniPaused: false,
//     sliderAmp: aniControls.amplitude,
//     itemsPerPage: -1,
//     headers: [
//         { text: 'Attributes', align: 'start', sortable: false, value: 'name' },
//         { text: 'Values', value: 'value', sortable: false }
//     ],
//     buildingAttrs: [
//         table_attr.structure.attributes.bid,
//         table_attr.structure.attributes.county,
//         table_attr.structure.attributes.town,
//         table_attr.structure.attributes.builtYear,
//         table_attr.structure.attributes.height,
//         table_attr.structure.attributes.floor,
//         table_attr.structure.attributes.coordinate,
//         table_attr.structure.attributes.circleNum,
//         table_attr.structure.attributes.floorArea,
//         table_attr.structure.attributes.buildArea,
//         table_attr.structure.attributes.boundSp,
//         table_attr.structure.attributes.triangles
//     ],
//     eqAttrs: [
//         table_attr.earthquake.attributes.eid,
//         table_attr.earthquake.attributes.pga,
//         table_attr.earthquake.attributes.duration,
//         table_attr.earthquake.attributes.cav
//     ],
//     cameraControls: cameraControls, // Add this line
//     timeControls: timeControls,     // If accessed externally, consider exposing these as well
//     aniControls: aniControls        // Similarly, expose if needed
// };

// // Add computed properties
// const appComputed = {
//     expandedPanels: {
//         get() {
//             return this._expandedPanels;
//         },
//         set(value) {
//             this._expandedPanels = value;
//             this.$emit('update:expandedPanels', value);
//         }
//     },
//     switch_anim: {
//         get() {
//             return this._switch_anim;
//         },
//         set(value) {
//             this._switch_anim = value;
//             this.$emit('update:switch_anim', value);
//         }
//     }
// };

// // window.table_attr = table_attr;
// // window.cameraControls = cameraControls;
// // window.timeControls = timeControls;
// // window.aniControls = aniControls;
