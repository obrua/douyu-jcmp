import Vue from "vue";
import AppComponent from "./App/App.vue";

Vue.component("app-component", AppComponent);

// import {
//   Card,
//   Button
// } from 'element-ui';

// Vue.use(Card);
// Vue.use(Button);

import ElementUI from 'element-ui'
Vue.use(ElementUI);

const obrua_bg = chrome.extension.getBackgroundPage();
const appDetails = chrome.app.getDetails();
// Vue.prototype.obrua_bg = obrua_bg
console.log(obrua_bg,chrome, appDetails)

new Vue({
  el: "#app",
  data: {
    obrua_bg: obrua_bg,
    appDetails: appDetails,
    obrua_chrome: chrome
  },
  render: createElement => {
    return createElement(AppComponent);
  }
});