// components/sidebar/AttributesPanel.js
export default {
  name: 'AttributesPanel',
  data() {
    return {
      structuresExpanded: true,
      earthquakesExpanded: true
    };
  },
  props: {
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
    }
  },
  emits: ['update:switch_interact', 'load-his-data', 'update-eq-table', 'reset-camera'],
  template: `
    <v-card
      outlined flat
      class="fill-height px-4 py-3 ma-2"
      style="border-radius: 16px; overflow: hidden; background-color: transparent !important;"
      elevation="0"
    >
      <v-row dense>
        <v-col cols="12">
          <!-- Structures Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title
              class="d-flex align-center py-3 px-3"
              style="cursor: pointer; background-color: rgba(30, 30, 30, 0.6);"
              @click="structuresExpanded = !structuresExpanded"
            >
              <v-icon class="mr-2 text-primary" size="24">mdi-domain</v-icon>
              <span class="text-h7 font-weight-bold text-white">Structures</span>
              <v-spacer></v-spacer>
              <v-icon color="primary">{{ structuresExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-expand-transition>
              <v-card-text v-show="structuresExpanded" class="pa-0">
                <v-col cols="12">
                  <v-card-actions class="px-4 py-2">
                    <v-switch
                      :model-value="switch_interact"
                      @update:model-value="$emit('update:switch_interact', $event)"
                      :label="\`交互 (双击选取)\`"
                      hide-details
                      dense
                      class="pa-0 ma-0"
                    ></v-switch>
                  </v-card-actions>
                </v-col>
                <v-col cols="12">
                  <v-data-table
                    dense
                    :headers="headers"
                    :items="buildingAttrs"
                    class="grey darken-4 px-4"
                    :items-per-page="itemsPerPage"
                    outlined tile
                    hide-default-footer
                    hide-default-header
                  ></v-data-table>
                </v-col>
              </v-card-text>
            </v-expand-transition>
          </v-card>

          <!-- Spacer -->
          <div class="my-4"></div>

          <!-- Earthquakes Section -->
          <v-card class="grey darken-4 rounded-lg my-3 pa-0" style="overflow: hidden; border-radius: 16px;" elevation="2">
            <v-card-title
              class="d-flex align-center py-3 px-3"
              style="cursor: pointer; background-color: rgba(30, 30, 30, 0.6);"
              @click="earthquakesExpanded = !earthquakesExpanded"
            >
              <v-icon class="mr-2 text-primary" size="24">mdi-pulse</v-icon>
              <span class="text-h7 font-weight-bold text-white">Earthquakes</span>
              <v-spacer></v-spacer>
              <v-icon color="primary">{{ earthquakesExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-expand-transition>
              <v-card-text v-show="earthquakesExpanded" class="pa-2">
                <v-card flat class="py-4 px-0 grey darken-4 rounded-lg my-2" style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-actions align="center">
                    <v-row>
                      <v-col cols="12" class="pb-0" >
                        <v-btn
                            @click="$emit('load-his-data')"
                            dark block small color="white"
                            variant="flat"
                            class="rounded-lg bg-primary"
                          >
                          获取地震动
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-actions>
                </v-card>
                <v-divider></v-divider>
                <v-card class="pa-4 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-sparkline
                    :fill="false"
                    :gradient="['#42b3f4']"
                    :line-width=1
                    :padding=8
                    :smooth="false"
                    :model-value="eq_his"
                    auto-draw
                    align="center"
                  ></v-sparkline>
                </v-card>
                <v-divider></v-divider>
                <v-card class="py-2 px-0 grey darken-4 rounded-lg my-2" flat style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-data-table
                    dense
                    :headers="headers"
                    :items="eqAttrs"
                    class="grey darken-4 px-4"
                    :items-per-page="itemsPerPage"
                    outlined tile
                    hide-default-footer
                    hide-default-header
                  ></v-data-table>
                </v-card>
                <v-divider></v-divider>
                <v-card flat class="py-4 px-0 grey darken-4 rounded-lg my-2" style="background-color: rgba(30, 30, 30, 0.4);">
                  <v-card-actions align="center">
                    <v-row>
                      <v-col cols="12" class="pb-0" >
                        <v-btn
                          @click="$emit('update-eq-table')"
                          dark block small color="white"
                          variant="flat"
                          class="rounded-lg bg-primary"
                        >
                          更新
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-actions>
                </v-card>
              </v-card-text>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  `
};
