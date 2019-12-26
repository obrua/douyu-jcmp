//content_scripts
console.debug('content-index.js')
import {
  Message,
  MessageBox
} from 'element-ui';

import 'chrome-extension-async';

if (!true) {
  MessageBox.confirm(`不知道为啥要使用才其他地方才可以用`, '哎', {
    confirmButtonText: '继续',
    cancelButtonText: '取消',
    customClass: 'obrua_dy_MessageBox',
    type: 'warning'
  }).then(() => {

  }).catch(() => {

  });
}

// 通过Chrome插件的API加载字体文件
(function insertElementIcons() {
  // let elementlink = document.createElement('link')
  // elementlink.href = window.chrome.extension.getURL("assets/css/global.scss");
  // elementlink.lang="scss";
  // elementlink.type = "text/css";
  // elementlink.rel = "stylesheet";
  // document.head.appendChild(elementlink);

  let elementIcons = document.createElement('style')
  elementIcons.type = 'text/css';
  elementIcons.textContent = `
        @font-face {
            font-family: "element-icons";
            src: url('${ window.chrome.extension.getURL("fonts/element-icons.woff")}') format('woff'),
            url('${ window.chrome.extension.getURL("fonts/element-icons.ttf ")}') format('truetype'); /* chrome, firefox, opera, Safari, Android, iOS 4.2+*/
        }
    `
  document.head.appendChild(elementIcons);
})();

// var locationurl = window.location.href;
// console.log(locationurl)

//插入网页js
function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}

function doMessage(data) {
  Message({
    type: data.type,
    duration: data.duration || 3000,
    dangerouslyUseHTMLString: true,
    customClass: 'maxZindex',
    message: data.message
  });
};

(function () {
  'use strict';
  window.onload = function () {
    // var injectjcmpIndex = 0;
    // var injectjcmpTimer = self.setInterval(function () {
    //   if ((window.socketProxy) || (injectjcmpIndex >= 50)) {
    //     injectScript(chrome.extension.getURL('js/quote/jcmp.js'), 'head');
    //     window.clearInterval(injectjcmpTimer);
    //     console.debug("injectjcmpTimer over!");
    //     return;
    //   };
      
    //   injectjcmpIndex++;
    // }, 2000);
    console.log("injectjcmpTimer start!")
    self.setTimeout(function () {
        injectScript(chrome.extension.getURL('js/quote/jcmp.js'), 'head');
        console.log("injectjcmpTimer over!");
    }, 10000);
  };
})();



