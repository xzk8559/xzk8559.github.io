// components/navigation/NavigationDrawer.js
export default {
  name: 'NavigationDrawer',
  props: {
    drawer: {
      type: Boolean,
      required: true
    },
    pageAside: {
      type: Number,
      required: true
    },
    // Props for child components
    overviewStats: {
      type: Object,
      required: true
    },
    expandedPanels: {
      type: Array,
      required: true
    },
    headers: {
      type: Array,
      required: true
    },
    buildingAttrs: {
      type: Array,
      required: true
    },
    eqAttrs: {
      type: Array,
      required: true
    },
    itemsPerPage: {
      type: Number,
      required: true
    },
    switch_interact: {
      type: Boolean,
      required: true
    },
    eq_his: {
      type: Array,
      required: true
    },
    camera_x: {
      type: [Number, String],
      required: true
    },
    camera_y: {
      type: [Number, String],
      required: true
    },
    slider_x: {
      type: Number,
      required: true
    },
    slider_y: {
      type: Number,
      required: true
    },
    switch_anim: {
      type: Boolean,
      default: false
    },
    ani_disabled: {
      type: Boolean,
      required: true
    },
    slider_vel: {
      type: Number,
      required: true
    },
    slider_amp: {
      type: Number,
      required: true
    },
    time_step: {
      type: Number,
      required: true
    },
    max_time_step: {
      type: Number,
      required: true
    },
    eq_str: {
      type: String,
      required: true
    }
  },
  emits: [
    'update:drawer',
    'update:switch_interact',
    'load-his-data',
    'update-eq-table',
    'reset-camera',
    'update:slider_x',
    'update:slider_y',
    'update:switch_anim',
    'switch-ani-state',
    'update:time_step',
    'update:slider_vel',
    'update:slider_amp',
    'pause-timeline',
    'reset-time-control'
  ],
  template: `
    <v-navigation-drawer
      :model-value="drawer"
      @update:model-value="$emit('update:drawer', $event)"
      app
      overlay-opacity="0"
      width="450"
      class="transparent-drawer floating-drawer"
    >
      <div>
        <!-- Overview Panel -->
        <overview-panel
          v-show="pageAside === 1"
          :overview-stats="overviewStats"
          :switch_anim="switch_anim"
          :ani_disabled="ani_disabled"
          @reset-camera="$emit('reset-camera')"
          @update:switch_anim="$emit('update:switch_anim', $event)"
          @switch-ani-state="$emit('switch-ani-state')"
          @reset-time-control="$emit('reset-time-control')"
        ></overview-panel>

        <!-- Attributes Panel -->
        <attributes-panel
          v-show="pageAside === 2"
          :expanded-panels="expandedPanels"
          :headers="headers"
          :building-attrs="buildingAttrs"
          :eq-attrs="eqAttrs"
          :items-per-page="itemsPerPage"
          :switch_interact="switch_interact"
          :eq_his="eq_his"
          @update:switch_interact="$emit('update:switch_interact', $event)"
          @load-his-data="$emit('load-his-data')"
          @update-eq-table="$emit('update-eq-table')"
          @reset-camera="$emit('reset-camera')"
        ></attributes-panel>

        <!-- Tools Panel -->
        <tools-panel
          v-show="pageAside === 3"
          :expanded-panels="expandedPanels"
          :camera_x="camera_x"
          :camera_y="camera_y"
          :slider_x="slider_x"
          :slider_y="slider_y"
          :switch_anim="switch_anim"
          :ani_disabled="ani_disabled"
          :slider_vel="slider_vel"
          :slider_amp="slider_amp"
          :time_step="time_step"
          :max_time_step="max_time_step"
          :eq_str="eq_str"
          :eq_his="eq_his"
          @update:slider_x="$emit('update:slider_x', $event)"
          @update:slider_y="$emit('update:slider_y', $event)"
          @reset-camera="$emit('reset-camera')"
          @update:switch_anim="$emit('update:switch_anim', $event)"
          @switch-ani-state="$emit('switch-ani-state')"
          @update:time_step="$emit('update:time_step', $event)"
          @update:slider_vel="$emit('update:slider_vel', $event)"
          @update:slider_amp="$emit('update:slider_amp', $event)"
          @pause-timeline="$emit('pause-timeline')"
          @reset-time-control="$emit('reset-time-control')"
        ></tools-panel>
      </div>
    </v-navigation-drawer>
  `
};
