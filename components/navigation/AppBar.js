// components/navigation/AppBar.js
export default {
  name: 'AppBar',
  props: {
    drawer: {
      type: Boolean,
      required: true
    }
  },
  emits: ['toggle-drawer', 'render-page', 'ensure-drawer-open'],
  methods: {
    handleTabClick(pageNumber) {
      console.log(`Clicked tab ${pageNumber}`);
      // If drawer is closed, open it first
      if (!this.drawer) {
        console.log('Drawer is closed, opening it');
        this.$emit('ensure-drawer-open');
      }
      this.$emit('render-page', pageNumber);
    }
  },
  template: `
    <v-app-bar
      app
      class="grey darken-4"
    >
      <v-row>
        <v-col cols="1" class="d-flex align-center pl-16">
          <v-app-bar-nav-icon @click.stop="$emit('toggle-drawer')"></v-app-bar-nav-icon>
        </v-col>
        <v-col cols="4" class="d-flex align-center">
          <v-toolbar-title class="text-md-h6 font-weight-black">城市建筑群震灾一体化分析与展示系统</v-toolbar-title>
        </v-col>
        <v-col cols="4">
          <v-tabs fixed-tabs class="grey darken-4 pl-2">
            <v-tab @click="handleTabClick(1)" class="text-h6">概览</v-tab>
            <v-tab @click="handleTabClick(2)" class="text-h6">建筑详情</v-tab>
            <v-tab @click="handleTabClick(3)" class="text-h6">控制工具</v-tab>
          </v-tabs>
        </v-col>
        <v-col></v-col>
      </v-row>
    </v-app-bar>
  `
};
