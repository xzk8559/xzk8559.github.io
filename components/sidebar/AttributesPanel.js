// components/sidebar/AttributesPanel.js
export default {
  name: 'AttributesPanel',
  data() {
    return {
      structuresExpanded: true
    };
  },
  props: {
    headers: {
      type: Array,
      required: true
    },
    buildingAttrs: {
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
  },
  emits: ['update:switch_interact'],
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
              style="cursor: pointer; background-color: rgba(50, 50, 50);"
              @click="structuresExpanded = !structuresExpanded"
            >
              <v-icon class="mr-2 text-primary" size="24">mdi-domain</v-icon>
              <span class="text-h7 font-weight-bold text-white">建筑详情</span>
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
                <v-col cols="12" v-if="switch_interact">
                  <v-data-table
                    :headers="headers"
                    :items="buildingAttrs"
                    class="grey darken-4 px-4"
                    :items-per-page="itemsPerPage"
                    outlined tile
                    hide-default-footer
                    hide-default-header
                  ></v-data-table>
                </v-col>
                <v-col cols="12" v-else>
                  <div class="text-center pa-4 text-caption text-grey">
                    开启交互功能以查看建筑详情
                  </div>
                </v-col>
              </v-card-text>
            </v-expand-transition>
          </v-card>


        </v-col>
      </v-row>
    </v-card>
  `
};
