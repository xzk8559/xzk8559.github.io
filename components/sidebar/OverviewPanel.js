// components/sidebar/OverviewPanel.js
export default {
  name: 'OverviewPanel',
  props: {
    overviewStats: {
      type: Object,
      required: true
    },
    switch_anim: {
      type: Boolean,
      required: false,
      default: false
    },
    ani_disabled: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      hoveredValue: null,
      legendMin: 0,
      legendMax: 1.013 // Based on the value used in calculateColorInterpolation function
    };
  },
  emits: [
    'reset-camera',
    'update:switch_anim',
    'switch-ani-state',
    'reset-time-control'
  ],
  template: `
    <v-card
      outlined
      flat
      class="fill-height px-4 py-3 ma-2"
      elevation="0"
      style="border-radius: 16px; overflow: hidden; background-color: transparent !important;"
    >
      <v-row dense>
        <v-col cols="12">
          <!-- Header Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title class="d-flex align-center py-3 px-3" style="background-color: rgba(30, 30, 30, 0.6);">
              <v-icon class="mr-2 text-primary" size="24">mdi-view-dashboard</v-icon>
              <span class="text-h7 font-weight-bold text-white">概览</span>
            </v-card-title>
            <v-divider class="mb-2"></v-divider>

            <!-- Overview Statistics Section -->
            <v-card-text class="py-1 px-2 rounded-lg" style="background-color: rgba(30, 30, 30, 0.4);">
              <v-row dense align="center" class="my-1">
                <v-col cols="2" class="py-1 d-flex justify-center">
                  <v-icon color="white lighten-1" size="18">mdi-domain</v-icon>
                </v-col>
                <v-col cols="5" class="py-1">
                  <span class="text-body-1 text-white">建筑数量</span>
                </v-col>
                <v-col cols="4" class="py-1 text-right">
                  <span class="text-body-2 text-grey lighten-2">{{ overviewStats.buildingCount }}</span>
                </v-col>
              </v-row>

              <v-row dense align="center" class="my-1">
                <v-col cols="2" class="py-1 d-flex justify-center">
                  <v-icon color="white lighten-2" size="18">mdi-cube-outline</v-icon>
                </v-col>
                <v-col cols="5" class="py-1">
                  <span class="text-body-1 text-white">区块大小</span>
                </v-col>
                <v-col cols="4" class="py-1 text-right">
                  <span class="text-body-2 text-grey lighten-2">{{ overviewStats.chunkSize }}</span>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider class="my-2"></v-divider>

            <!-- Map Bounds Section -->
            <v-card-title class="text-subtitle-1 font-weight-medium text-white py-2 px-1">
              <v-icon class="mr-2 text-white" size="20">mdi-map-outline</v-icon>
              区域范围
            </v-card-title>

            <v-card-text class="pt-1 px-2 rounded-lg" style="background-color: rgba(30, 30, 30, 0.4);">
              <v-row dense align="center" class="my-1">
                <v-col cols="3" class="pl-4">
                  <span class="text-caption text-grey lighten-1">X Min:</span>
                </v-col>
                <v-col cols="3" class="pr-6 text-right">
                  <span class="text-body-2 text-white">{{ overviewStats.xMin }}</span>
                </v-col>
                <v-col cols="3" class="pl-4">
                  <span class="text-caption text-grey lighten-1">X Max:</span>
                </v-col>
                <v-col cols="3" class="pr-6 text-right">
                  <span class="text-body-2 text-white">{{ overviewStats.xMax }}</span>
                </v-col>
              </v-row>

              <v-row dense align="center" class="my-1">
                <v-col cols="3" class="pl-4">
                  <span class="text-caption text-grey lighten-1">Y Min:</span>
                </v-col>
                <v-col cols="3" class="pr-6 text-right">
                  <span class="text-body-2 text-white">{{ overviewStats.yMin }}</span>
                </v-col>
                <v-col cols="3" class="pl-4">
                  <span class="text-caption text-grey lighten-1">Y Max:</span>
                </v-col>
                <v-col cols="3" class="pr-6 text-right">
                  <span class="text-body-2 text-white">{{ overviewStats.yMax }}</span>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Spacer -->
          <div class="my-4"></div>

          <!-- Quick Actions Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title class="text-subtitle-1 font-weight-medium text-white py-2 px-1">
              <v-icon class="mr-2 text-white" size="20">mdi-lightning-bolt</v-icon>
              快速操作
            </v-card-title>

            <v-card-text class="pt-1 px-2 rounded-lg" style="background-color: rgba(30, 30, 30, 0.4);">
              <v-row dense class="my-1">
                <v-col cols="6" class="px-4">
                  <v-btn
                    @click="$emit('update:switch_anim', !switch_anim); $emit('switch-ani-state')"
                    color="primary"
                    block
                    small
                    class="text-white rounded-lg"
                  >
                    <v-icon left size="18">{{ switch_anim ? 'mdi-pause-circle' : 'mdi-play-circle' }}</v-icon>
                    {{ switch_anim ? '停止动画' : '开始动画' }}
                  </v-btn>
                </v-col>
                <v-col cols="6" class="px-4">
                  <v-btn
                    @click="$emit('reset-time-control')"
                    color="primary"
                    block
                    small
                    class="text-white rounded-lg"
                  >
                    <v-icon left size="18">mdi-restart</v-icon>
                    重置动画
                  </v-btn>
                </v-col>
              </v-row>
              <v-row dense class="my-1">
                <v-col cols="12" class="px-4">
                  <v-btn
                    @click="$emit('reset-camera')"
                    color="primary"
                    block
                    small
                    class="text-white rounded-lg"
                  >
                    <v-icon left size="18">mdi-refresh</v-icon>
                    重置视图
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Spacer -->
          <div class="my-4"></div>

          <!-- Color Legend Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title class="text-subtitle-1 font-weight-medium text-white py-2 px-1">
              <v-icon class="mr-2 text-white" size="20">mdi-palette</v-icon>
              响应图例（最大层间位移）
            </v-card-title>

            <v-card-text class="pt-1 px-2 rounded-lg" style="background-color: rgba(30, 30, 30, 0.4);">
              <div class="color-legend-container">
                <div
                  class="color-legend-bar"
                  @mousemove="updateHoveredValue($event)"
                  @mouseleave="hoveredValue = null"
                >
                  <div v-for="i in 32" :key="i" class="color-segment" :style="getColorStyle(i)"></div>
                </div>
                <div class="color-legend-labels">
                  <span class="text-caption text-grey lighten-1">{{ legendMin.toFixed(1) }} </span>
                  <span v-if="hoveredValue !== null" class="text-caption text-white">{{ hoveredValue.toFixed(1) }}</span>
                  <span class="text-caption text-grey lighten-1">{{ legendMax.toFixed(3) }} (mm)</span>
                </div>
              </div>
              <div class="text-caption text-center text-grey lighten-1 mt-1">
                <small>鼠标悬停查看具体数值</small>
              </div>
            </v-card-text>
          </v-card>

        </v-col>
      </v-row>
    </v-card>
  `,
  methods: {
    getColorStyle(index) {
      // Custom color map matching the ThreeJS Lut implementation
      const colors = [
        '#237D49', // 0.0 -  35, 125, 73
        '#68A245', // 0.2 - 104, 162, 69
        '#A1C457', // 0.4 - 161, 196, 87
        '#EDA955', // 0.6 - 237, 169, 85
        '#F26440', // 0.8 - 242, 100, 64
        '#BA332C'  // 1.0 - 186,  51, 44
      ];

      const position = (index - 1) / 31;
      let color;

      if (position <= 0.2) {
        color = this.interpolateColor(colors[0], colors[1], position / 0.2);
      } else if (position <= 0.4) {
        color = this.interpolateColor(colors[1], colors[2], (position - 0.2) / 0.2);
      } else if (position <= 0.6) {
        color = this.interpolateColor(colors[2], colors[3], (position - 0.4) / 0.2);
      } else if (position <= 0.8) {
        color = this.interpolateColor(colors[3], colors[4], (position - 0.6) / 0.2);
      } else {
        color = this.interpolateColor(colors[4], colors[5], (position - 0.8) / 0.2);
      }

      return { backgroundColor: color };
    },
    interpolateColor(color1, color2, factor) {
      const hex = (x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);

      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);

      const r = r1 + factor * (r2 - r1);
      const g = g1 + factor * (g2 - g1);
      const b = b1 + factor * (b2 - b1);

      return `#${hex(r)}${hex(g)}${hex(b)}`;
    },
    updateHoveredValue(event) {
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const width = rect.width;
      const position = x / width;

      this.hoveredValue = this.legendMin + position * (this.legendMax - this.legendMin);
    }
  }
};

