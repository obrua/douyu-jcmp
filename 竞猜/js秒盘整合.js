const regex = /[^/]+@=[^/]*\//g;
const regexArraySplitter = /[^/]+\//g;

// stt from https://github.com/PennTao/stt-serde-mjs
/**
 * A function to serialize a JSON into string
 * @param records A JSON object to be serialized to string
 * @return        STT serialized string
 */
const serialize = (records) => {
  if (records === null) {
    return '';
  }
  if (typeof records === 'string') {
    return records.replace(/@/g, '@A').replace(/\//g, '@S');
  }
  if (typeof records === 'number') {
    return records.toString();
  }
  let serializedString = '';
  if (Array.isArray(records)) {
    return records.map(record => serialize(record).replace(/@/g, '@A').replace(/\//g, '@S') + '/').join('');
  }
  Object.entries(records).forEach(([key, value]) => {
    serializedString = serializedString + serialize(key).replace(/@/g, '@A').replace(/\//g, '@S') + '@=' + serialize(value).replace(/@/g, '@A').replace(/\//g, '@S') + '/';
  });

  return serializedString;
};

/**
 * A function to deserialized a string into JSON
 * @param message A STT serialized string, usually received from Douyu danmaku server
 * @return        STT deserialized JSON representing of the message
 */

const deserialize = (message) => {
  if (message === null) {
    return null;
  }
  const record = {};
  const entries = message.match(regex);
  if (entries !== null) {
    entries.forEach((entry) => {
      const kvps = entry.split('@=');
      const key = kvps[0].replace(/@S/g, '/').replace(/@A/g, '@');
      const value = kvps[1].slice(0, -1).replace(/@S/g, '/').replace(/@A/g, '@');
      record[deserialize(key)] = deserialize(value);
    });
    return record;
  }
  const items = message.match(regexArraySplitter);

  if (items !== null) {
    return items.map(item => deserialize(item.slice(0, -1).replace(/@S/g, '/').replace(/@A/g, '@')));
  }
  return message.replace(/@S/g, '/').replace(/@A/g, '@');
};


/*
左边押注
window.jc_left_data={
  qid_竞猜编号: {
    倍率: 资金池id_资金池数量,
    倍率: 资金池id_资金池数量,
    倍率: 资金池id_资金池数量
  },
  qid_竞猜编号: {
    倍率: 资金池id_资金池数量,
    倍率: 资金池id_资金池数量,
    倍率: 资金池id_资金池数量
  }
}
*/
window.jc_left_data = {}
window.jc_right_data = {}

window.socketProxy.socketStream.subscribe(
  'rquizisn',
  function (data) {
    let jc_data = deserialize(data.qril);
    console.debug(jc_data)
    for (i in jc_data) {
      let item = jc_data[i];

      
      //倍率为0 排除
      let pidkey = 'qid_' + item.qid;
      let qiditem = {};
      if (item.folpc != 0) {
      if (window.jc_left_data.hasOwnProperty(pidkey)) {
        qiditem[item.folpc] = item.fbid + '_' + item.fbmc
        window.jc_left_data[pidkey] = { ...window.jc_left_data[pidkey], ...qiditem }
      } else {
        qiditem[item.folpc] = item.fbid + '_' + item.fbmc
        window.jc_left_data[pidkey] = qiditem
      }};
      if (item.solpc != 0) {
      if (window.jc_right_data.hasOwnProperty(pidkey)) {
        qiditem[item.solpc] = item.sbid + '_' + item.sbmc
        window.jc_left_data[pidkey] = { ...window.jc_left_data[pidkey], ...qiditem }
      } else {
        qiditem[item.solpc] = item.sbid + '_' + item.sbmc
        window.jc_right_data[pidkey] = qiditem
      }}

    }
    console.debug(window.jc_left_data, window.jc_right_data)

  }
);


window.socketProxy.socketStream.subscribe(
  'rquiziln',
  function (data) {
    console.log('rquiziln', '重新开猜');
    console.debug('rquiziln', data);
    window.jc_left_data = {};
    window.jc_right_data = {};
  }
);

//generate random uuid
function guid() {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
//cookie acf_ccn expire time set 3h
function setCookie(cookiename, value) {
  var exp = new Date();
  exp.setTime(exp.getTime() + 3 * 60 * 60 * 1000);
  document.cookie = cookiename + "=" + escape(value) + "; path=/; expires=" + exp.toGMTString();
}
//get fast assign cookie
function getCookie(cookieName) {//here should use trim()
  var acf_ccn = "";
  var strCookie = document.cookie;
  var arrCookie = strCookie.split("; ");
  for (var i = 0; i < arrCookie.length; i++) {
    var arr = arrCookie[i].split("=");
    if (cookieName == arr[0]) {
      acf_ccn = arr[1];
    }
  }
  return acf_ccn;
}
// get effect cookie
function getEffectCookie(cookiename) {
  let cookie = getCookie(cookiename);
  if (cookie != null && cookie != "") {
    return cookie;
  } else {
    setCookie(cookiename, guid());
    return getCookie(cookiename);
  }
}
// get real roomId
function getRoomId() {
  var roomId = document.getElementsByClassName("Title-anchorName")[0];
  if (roomId != undefined) {
    roomId = window.socketProxy.info.room.roomId;
  } else {
    roomId = "99999";
    console.warn("无法获取当前房间号！");
  }
  return roomId;
}
// // get quiz_id
// function getQuizId(){
//     var quizId = "";
//     return quizId;
// }
// // get bank_id
// function getBankId(){
//     var bankId = "";
//     return bankId;
// }
// get user fishball number
function getFishBallNum() {
  var fishball = 0;
  fetch('https://www.douyu.com/member/cp/cp_rpc_ajax', {
    method: 'GET',
    mode: 'no-cors',
    cache: 'default',
    credentials: 'include',
  }).then(res => {
    return res.json();
  }).then(json => {
    fishball = json.info.balance;
  }).catch(err => {
    console.error('REQUEST ERROR', err);
  })
  return fishball;
}

function getGuessGameBox() {
  // let btnPosition = document.getElementsByClassName("guessGame--displayBFC");
  // let setupposition = document.getElementsByClassName("GuessGameBox-beginGuessBox");
  let mainBox = document.getElementsByClassName("GuessGameBox");
  for (let i = 0; i < mainBox.length; i++) {
    let divTag = document.createElement("div");
    divTag.setAttribute('style', 'margin-top:-3px;');
    divTag.innerHTML = "<div style='width:130px;height:20px;background-color:#FF866B; border-radius:4px; display:inline-block;' id='eat_left_" + i + "'>开始秒盘</div>";
    divTag.innerHTML += "<div style='margin:0 7px;width:60px;height:20px;background-color:orange; border-radius:4px; display:inline-block;' id='setup_quiz_" + i + "'>秒盘设置</div>";
    divTag.innerHTML += "<div style='width:130px;height:20px;background-color:#6888FF; border-radius:4px; display:inline-block;' id='eat_right_" + i + "'>开始秒盘</div>";
    mainBox[i].append(divTag);
    // document.getElementById("eat_left_"+i).addEventListener('click',function(){setQuizConfig(i)});
    // document.getElementById("eat_right_"+i).addEventListener('click',function(){setQuizConfig(i)});
    // let quizSetupObj = document.getElementsByClassName("GuessGameBox-main");
    let quizSetupObj = mainBox[i].getElementsByClassName("GuessGameBox-main")[0];
    let divTagBox = document.createElement("div");
    divTagBox.setAttribute("id", "quiz_window_" + i);
    divTagBox.setAttribute("style", "background-color:white;width:334px;height:98px;position:absolute;margin-bottom:15px;margin-left:0;color:black;z-index:100;display:none;");
    divTagBox.innerHTML = '赔率范围 : <input type="text" style="width:50px;border-radius:4px;" id="pay_raido_start_' + i + '"/>~';
    divTagBox.innerHTML += '<input type="text" style="width:50px;border-radius:3px;" id="pay_raido_end_' + i + '" value="9.9" disabled ="disabled"/>';
    divTagBox.innerHTML += '<div>鱼丸数量 : <input type="text" value="" style="width:115px;border-radius:4px;" id="pay_fish_ball_' + i + '"/></div>';
    divTagBox.innerHTML += '<div style="margin:10px 20px;background-color:#87CEFF;border-radius: 3px;width:72px;display:inline-block;" id="clear_btn_' + i + '">清空</div>';
    divTagBox.innerHTML += '<div style="margin:10px 20px;background-color:orange;border-radius: 3px;width:72px;display:inline-block;" id="close_btn_' + i + '">关闭</div>';
    quizSetupObj.insertBefore(divTagBox, quizSetupObj.firstElementChild);

    let quizId = mainBox[i].getAttribute("data-qid");//get quizId;
    console.info(quizId);
    document.getElementById("setup_quiz_" + i).addEventListener('click', function () { setQuizConfig(i) });
    document.getElementById("close_btn_" + i).addEventListener('click', function () { setQuizConfig(i) });
    document.getElementById("clear_btn_" + i).addEventListener('click', function () { clearInputContent(this) });
    document.getElementById("eat_left_" + i).addEventListener('click', function () { eatAllLeftBall(i, quizId) });
    document.getElementById("eat_right_" + i).addEventListener('click', function () { eatAllRightBall(i, quizId) });
  }
}
getGuessGameBox();

function setQuizConfig(code) {
  // console.info(code);
  let showSwitch = document.getElementById("quiz_window_" + code).style.display;
  if (showSwitch == "none") {
    document.getElementById("quiz_window_" + code).style.display = "inherit";
  } else {
    if (checkInputValidate(code)) {
      document.getElementById("quiz_window_" + code).style.display = "none";
    }
  }
}

function isNumber(num) {
  var reg = new RegExp("^[0-9]*$");
  return reg.test(num);
}

function isFloat(num) {
  // var reg = new RegExp("^\d+(\.\d+)?$");
  var reg = new RegExp("^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$");
  return reg.test(num);
}

// var minRadio,maxRadio,betFishBall;
// check the input text is illegal
function checkInputValidate(code) {
  var validateFlag = true;
  let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
  let payRadioStart = elementNode[0].value.trim();
  let payRadioEnd = elementNode[1].value.trim();
  let payFishBall = elementNode[2].value.trim();
  if ((!isNumber(payRadioStart) && !isFloat(payRadioStart)) && payRadioStart != "") {
    validateFlag = false;
    alert("起始赔率设置错误，请重新输入");
  }
  if ((!isNumber(payRadioEnd) && !isFloat(payRadioEnd)) && payRadioEnd != "") {
    validateFlag = false;
    alert("结束赔率设置错误，请重新输入");
  }
  if (!isNumber(payFishBall) && payFishBall != "") {
    validateFlag = false;
    alert("鱼丸数量设置错误，请重新输入");
  }
  // minRadio = Math.min(payRadioStart,payRadioEnd);
  // maxRadio = Math.max(payRadioStart,payRadioEnd);
  // betFishBall = payFishBall;
  return validateFlag;
}
// clear input text content
function clearInputContent(obj) {
  let elementNode = obj.parentNode.getElementsByTagName("input");
  elementNode[0].value = "";
  elementNode[2].value = "";
  // for(let i=0;i<elementNode.length;i++){
  //     console.info(elementNode[i].value);
  //     elementNode[i].value="";
  // }
}
// bet all fish ball on left side
function eatAllLeftBall(code, quizId) {
  console.info("left" + code);
  var bankList = [];
  let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
  let payRadioStart = elementNode[0].value.trim();
  // let payRadioEnd = elementNode[1].value.trim();
  let payFishBall = elementNode[2].value.trim();

  // betQuizRequest(payFishBall,getQuizId,getBankId());
  var jcleftData = window.jc_left_data;
  for (let key in jcleftData) {
    if (key.indexOf(quizId) > -1) {
      var leftBankData = jcleftData[key];
      for (let kk in leftBankData) {
        if (kk >= payRadioStart * 100) {
          let tempList = leftBankData[kk].split('_');
          // let jsonData=;
          bankList.push({ "bankId": tempList[0], "pondMoney": tempList[1], "quizId": quizId });
        }
      }
    }
  }
  if (bankList.length > 0) {
    loopEatPondMoney(code, bankList, payFishBall);
  }
}

// bet all fish ball on right side
function eatAllRightBall(code, quizId) {
  console.info("right_code:" + code);
  console.info("quiz_Id:" + code);
  var bankList = [];
  let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
  let payRadioStart = elementNode[0].value.trim();
  console.info("赔率为：" + payRadioStart);
  // let payRadioEnd = elementNode[1].value.trim();
  let payFishBall = elementNode[2].value.trim();
  // betQuizRequest(payFishBall,getQuizId,getBankId());
  var jcRightData = window.jc_right_data;
  for (let key in jcRightData) {
    if (key.indexOf(quizId) > -1) {
      var rightBankData = jcRightData[key];
      console.info(rightBankData);
      for (let kk in rightBankData) {
        if (kk >= payRadioStart * 100) {
          console.info(kk);
          let tempList = rightBankData[kk].split('_');
          // let jsonData=;
          bankList.push({ "bankId": tempList[0], "pondMoney": tempList[1], "quizId": quizId });
        }
      }
    }
  }
  console.info(bankList);
  console.info(payFishBall);
  if (bankList.length > 0) {
    loopEatPondMoney(code, bankList, payFishBall);
  }
}

//循环加注一次秒盘 ，暂未加一直检测监定时任务
function loopEatPondMoney(code, bankList, payFishBall) {
  var num = 0;
  var fishBall = payFishBall;
  loopBetRecycle();
  console.log("秒盘开始");
  function loopBetRecycle() {
    if (num == bankList.length) {
      console.log("秒盘完成");
    } else {
      console.log("秒盘进行");
      betQuizRequest(fishBall, bankList[num].quizId, bankList[num].bankId);
      fishball = fishBall - bankList[num].pondMoney;
      num++;
    }
  }

  function betQuizRequest(payBall, quizId, bankId) {
    let postData = "ctn=" + getEffectCookie("acf_ccn") + "&room_id=" + getRoomId() + "&quiz_id=" + quizId + "&bet_amount=" + payBall + "&money_type=1&banker_id=" + bankId;
    // let postData = "ctn=2c62895477257c0168cdeb875ba356dc&room_id=6256301&quiz_id=3972015&bet_amount=11111&money_type=1&banker_id=92532200";
    fetch('https://www.douyu.com/member/quiz/user_bet', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postData
    }).then(result => {
      return result.json();
    }).then(json => {
      console.info(json);
      loopBetRecycle();
    }).catch(err => {
      console.error('REQUEST ERROR', err);
    })
  }
}