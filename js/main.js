// js/main.js

const app = new Vue({
    el: '#app',
    vuetify: new Vuetify({ theme: { dark: true } }),
    data: {
        drawer: null,
        expandedPanels: [0, 1],
        activeTab: 1,  // 1 => Attributes, 2 => Tools

        // From original code1
        cameraX: 0,
        cameraY: 0,
        sliderX: cameraControls.x_set,
        sliderY: cameraControls.y_set,

        eqStr: "",
        eqHistory: [0, 0, 0, 0, 0, 0, -1, -1, 3, 3, -2.5, -2.5, 1.5, 1.5, -1, -1, 3, 3, -2.5, -2.5, 1.5, 1.5, -1.8, -1.8, 1, 1, -1, -1, 0, 0, 0, 0, 0, 0],
        timeStep: 0,
        maxTimeStep: 120,

        switch_anim: aniControls.animation,
        aniDisabled: true,

        switchInteract: table_attr.structure.isInteractive,
        sliderVel: aniControls.velocity,
        sliderAmp: aniControls.amplitude,
        itemsPerPage: -1,
        headers: [
            { text: "Attributes", align: "start", sortable: false, value: "name" },
            { text: "Values", value: "value", sortable: false }
        ],
        buildingAttrs: [
            table_attr.structure.attributes.bid,
            table_attr.structure.attributes.county,
            table_attr.structure.attributes.town,
            table_attr.structure.attributes.builtYear,
            table_attr.structure.attributes.height,
            table_attr.structure.attributes.floor,
            table_attr.structure.attributes.coordinate,
            table_attr.structure.attributes.circleNum,
            table_attr.structure.attributes.floorArea,
            table_attr.structure.attributes.buildArea,
            table_attr.structure.attributes.boundSp,
            table_attr.structure.attributes.triangles
        ],
        eqAttrs: [
            table_attr.earthquake.attributes.eid,
            table_attr.earthquake.attributes.pga,
            table_attr.earthquake.attributes.duration,
            table_attr.earthquake.attributes.cav
        ]
    },
    methods: {
        // Equivalent to code1's renderPage_1, renderPage_2:
        renderPage(pageIndex) {
            this.activeTab = pageIndex;
        },

        toggleDrawer() {
            this.drawer = !this.drawer;
        },

        resetCamera() {
            cameraControls.isReset = 1; // same logic from code1
        },

        resetTimeControl() {
            timeControls.isReset = 1;
        },

        updateEarthquakeTable() {
            table_attr.earthquake.needsUpdate = 1;
        },

        loadHistoryData() {
            table_attr.response.history.needsLoad = 1;
        },

        toggleTimelinePause() {
          // In code1 we had `this.ani_paused = !this.ani_paused;`
          // For simplicity, we handle that in the animation-controller or globally
          // Here, you can just dispatch an event or store a paused state if needed
        },

        toggleAnimationState() {
            this.aniDisabled = !this.aniDisabled;
            // Code1:  this.ani_paused = !this.ani_disabled;
        },

        updateTimeStep(newVal) {
            this.timeStep = newVal;
        },

        updateSliderVel(newVal) {
            this.sliderVel = newVal;
        },

        updateSliderAmp(newVal) {
            this.sliderAmp = newVal;
        },

        // Animation methods removed
    }
});

window.app = app;

// // Expose cameraControls globally
// window.cameraControls = app.cameraControls;
// window.timeControls = app.timeControls;
// window.aniControls = app.aniControls;
