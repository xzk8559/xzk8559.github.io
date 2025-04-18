// components/index.js
import AppBar from './navigation/AppBar.js';
import Footer from './navigation/Footer.js';
import NavigationDrawer from './navigation/NavigationDrawer.js';
import OverviewPanel from './sidebar/OverviewPanel.js';
import AttributesPanel from './sidebar/AttributesPanel.js';
import ToolsPanel from './sidebar/ToolsPanel.js';

export default {
  install(app) {
    // Register all components
    app.component('app-bar', AppBar);
    app.component('app-footer', Footer);
    app.component('navigation-drawer', NavigationDrawer);
    app.component('overview-panel', OverviewPanel);
    app.component('attributes-panel', AttributesPanel);
    app.component('tools-panel', ToolsPanel);
  }
};
