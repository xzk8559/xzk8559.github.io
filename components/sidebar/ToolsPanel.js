// components/sidebar/ToolsPanel.js
export default {
  name: 'ToolsPanel',
  data() {
    return {
      cameraExpanded: false,
      animationExpanded: true
    };
  },
  props: {
    expandedPanels: {
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
      required: true
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
    },
    eq_his: {
      type: Array,
      required: true
    },
    ani_paused: {
      type: Boolean,
      required: true
    },
    overviewStats: {
      type: Object,
      required: true
    }
  },
  emits: [
    'update:slider_x',
    'update:slider_y',
    'reset-camera',
    'update:switch_anim',
    'switch-ani-state',
    'update:time_step',
    'update:slider_vel',
    'update:slider_amp',
    'pause-timeline',
    'reset-time-control'
  ],
  template: `
    <v-card
      outlined flat
      class="fill-height px-4 py-3 ma-2"
      style="border-radius: 16px; overflow: hidden; background-color: transparent !important;"
      elevation="0"
    >
      <v-row dense>
        <v-col cols="12">
          <!-- Animation Controller Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title
              class="d-flex align-center py-3 px-3"
              style="cursor: pointer; background-color: rgba(50, 50, 50);"
              @click="animationExpanded = !animationExpanded"
            >
              <v-icon class="mr-2 text-primary" size="24">mdi-animation-play</v-icon>
              <span class="text-h7 font-weight-bold text-white">动画控制器</span>
              <v-spacer></v-spacer>
              <v-icon color="primary">{{ animationExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-expand-transition>
              <v-card-text v-show="animationExpanded" class="pa-2">
                <v-card class="grey darken-4 rounded-lg" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-actions class="px-2">
                    <v-switch
                      :model-value="switch_anim"
                      @update:model-value="$emit('update:switch_anim', $event); $emit('switch-ani-state')"
                      :label="\`动画\`"
                      dense
                      class="pl-4"
                    ></v-switch>
                  </v-card-actions>
                </v-card>
                <v-card class="pa-3 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-subtitle class="pb-1">加速度时程{{ eq_str }}</v-card-subtitle>
                  <v-row justify="space-around" dense>
                    <v-col cols="12">
                      <v-card class="px-4 pb-0 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                        <v-sparkline
                        :fill="false"
                        :gradient="['#42b3f4']"
                        line-width=.5
                        :padding=8
                        :smooth="false"
                        :model-value="eq_his"
                        auto-draw
                        ></v-sparkline>
                      </v-card>
                    </v-col>
                    <v-col cols="12">
                      <v-card class="py-0 px-4 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                        <v-slider
                        :model-value="time_step"
                        @update:model-value="$emit('update:time_step', $event)"
                        min="0"
                        :max="max_time_step"
                        thumb-label
                        hide-details
                        :disabled="ani_disabled"
                        ></v-slider>
                        <div class="d-flex justify-space-between px-2 pb-1">
                          <span class="text-caption text-primary">Current: {{ Math.ceil(time_step) }}</span>
                          <span class="text-caption text-primary">Max: {{ Math.ceil(max_time_step) }}</span>
                        </div>
                      </v-card>
                    </v-col>

                    <v-col cols="1"></v-col>
                    <v-col cols="2"><v-card-subtitle class="pt-8 pb-0 px-0 mx-0">速度</v-card-subtitle></v-col>
                    <v-col cols="8" class="d-flex align-center pt-8 pb-0 px-0 mx-0">
                      <v-slider
                      :model-value="slider_vel"
                      @update:model-value="$emit('update:slider_vel', $event)"
                      min="0.0"
                      max="5.0"
                      step="0.1"
                      thumb-label
                      hide-details
                      :disabled="ani_disabled"
                      ></v-slider>
                    </v-col>
                    <v-col cols="1"></v-col>

                    <v-col cols="1"></v-col>
                    <v-col cols="2"><v-card-subtitle class="pu-0 px-0 mx-0">幅值</v-card-subtitle></v-col>
                    <v-col cols="8" class="d-flex align-center pu-0 px-0 mx-0">
                      <v-slider
                      :model-value="slider_amp"
                      @update:model-value="$emit('update:slider_amp', $event)"
                      min="0"
                      max="10"
                      step="0.1"
                      thumb-label
                      hide-details
                      :disabled="ani_disabled"
                      ></v-slider>
                    </v-col>
                    <v-col cols="1"></v-col>

                    <v-col cols="6">
                      <v-card-actions class="pb-3">
                        <v-btn
                          @click="$emit('pause-timeline')"
                          dark block small
                          variant="tonal"
                          class="rounded-lg text-white"
                          :disabled="ani_disabled">
                          <v-icon left size="18">{{ ani_paused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
                          {{ ani_paused ? '继续' : '暂停' }}
                        </v-btn>
                      </v-card-actions>
                    </v-col>
                    <v-col cols="6">
                      <v-card-actions class="pb-3">
                        <v-btn
                          @click="$emit('reset-time-control')"
                          dark block small
                          variant="tonal"
                          class="rounded-lg text-white"
                          :disabled="ani_disabled">
                          <v-icon left size="18">mdi-restart</v-icon>
                          重置
                        </v-btn>
                      </v-card-actions>
                    </v-col>

                  </v-row>
                </v-card>
              </v-card-text>
            </v-expand-transition>
          </v-card>

          <!-- Spacer -->
          <div class="my-4"></div>

          <!-- Camera Controller Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title
              class="d-flex align-center py-3 px-3"
              style="cursor: pointer; background-color: rgba(50, 50, 50);"
              @click="cameraExpanded = !cameraExpanded"
            >
              <v-icon class="mr-2 text-primary" size="24">mdi-camera-control</v-icon>
              <span class="text-h7 font-weight-bold text-white">相机控制器</span>
              <v-spacer></v-spacer>
              <v-icon color="primary">{{ cameraExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-expand-transition>
              <v-card-text v-show="cameraExpanded" class="pa-2">
                <v-card class="pa-3 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-subtitle class="pb-2">当前位置</v-card-subtitle>
                  <v-row justify="space-around" dense>
                    <v-col cols="6" class="d-flex align-center">
                      <span class="text-h5 font-weight-light mx-auto">{{ camera_x }}</span>
                    </v-col>
                    <v-col cols="6" class="d-flex align-center">
                      <span class="text-h5 font-weight-light mx-auto" v-text="camera_y"></span>
                    </v-col>
                  </v-row>
                </v-card>
                <v-card class="pa-3 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-subtitle class="pb-1">设置相机位置</v-card-subtitle>
                  <v-row dense>
                    <v-col cols="1"></v-col>
                    <v-col cols="7" class="d-flex align-center">
                      <v-slider
                        :model-value="slider_x"
                        @update:model-value="$emit('update:slider_x', $event)"
                        min="0"
                        max="1000"
                        label="x :"
                        hide-details
                        class="rounded-lg"
                      ></v-slider>
                    </v-col>
                    <v-col cols="3">
                      <v-text-field
                        :model-value="slider_x"
                        @update:model-value="$emit('update:slider_x', $event)"
                        class="mt-0 pt-0 rounded-lg"
                        hide-details
                        single-line
                        dense
                        variant="outlined"
                        label="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="1"></v-col>
                    <v-col cols="1"></v-col>
                    <v-col cols="7" class="d-flex align-center">
                      <v-slider
                        :model-value="slider_y"
                        @update:model-value="$emit('update:slider_y', $event)"
                        min="0"
                        max="1000"
                        label="y :"
                        hide-details
                        class="rounded-lg"
                      ></v-slider>
                    </v-col>
                    <v-col cols="3">
                      <v-text-field
                        :model-value="slider_y"
                        @update:model-value="$emit('update:slider_y', $event)"
                        class="mt-0 pt-0 rounded-lg"
                        hide-details
                        single-line
                        dense
                        variant="outlined"
                        label="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="1"></v-col>
                  </v-row>
                </v-card>
                <v-card class="pa-2 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-actions>
                    <v-btn
                      @click="$emit('reset-camera')"
                      dark block small color="white"
                      variant="flat"
                      class="rounded-lg bg-primary"
                    >重置视图</v-btn>
                  </v-card-actions>
                </v-card>

                <!-- Map Bounds Section -->
                <v-card class="pa-2 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-title class="text-subtitle-1 font-weight-medium text-white py-2 px-1">
                    <v-icon class="mr-2 text-white" size="20">mdi-map-outline</v-icon>
                    区域范围
                  </v-card-title>
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
                </v-card>
              </v-card-text>
            </v-expand-transition>
          </v-card>

        </v-col>
      </v-row>
    </v-card>
  `
};
