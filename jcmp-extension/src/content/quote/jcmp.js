
const regex = /[^/]+@=[^/]*\//g;
const regexArraySplitter = /[^/]+\//g;
const loomTimeGap = 50;//轮询时间ms
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

            let pidkey = 'qid_' + item.qid;
            let qiditem = {};
            if (item.folpc != 0) {
                if (window.jc_left_data.hasOwnProperty(pidkey)) {
                    qiditem[item.folpc] = item.fbid + '_' + item.fbmc;
                    window.jc_left_data[pidkey] = { ...window.jc_left_data[pidkey], ...qiditem };

                    for (key in window.jc_left_data[pidkey]) {
                        if (key > item.folpc) {
                            console.debug(window.jc_left_data[pidkey][key], key);
                            delete window.jc_left_data[pidkey][key];
                        }
                    };
                } else {
                    qiditem[item.folpc] = item.fbid + '_' + item.fbmc;
                    window.jc_left_data[pidkey] = qiditem;
                }
            } else {
                delete window.jc_left_data[pidkey];
            }


            if (item.solpc != 0) {
                qiditem = {};
                if (window.jc_right_data.hasOwnProperty(pidkey)) {
                    qiditem[item.solpc] = item.sbid + '_' + item.sbmc;
                    window.jc_right_data[pidkey] = { ...window.jc_right_data[pidkey], ...qiditem };
                    for (key in window.jc_right_data[pidkey]) {
                        if (key > item.solpc) {
                            console.debug(window.jc_right_data[pidkey][key], key);
                            delete window.jc_right_data[pidkey][key];
                        }
                    };
                } else {
                    qiditem[item.solpc] = item.sbid + '_' + item.sbmc;
                    window.jc_right_data[pidkey] = qiditem;
                }
            } else {
                delete window.jc_right_data[pidkey];
            }

            try {
                renewMoneyPond(item.qid, true, item.fbmc);
                renewMoneyPond(item.qid, false, item.sbmc);
            } catch (error) {
                //console.debug(error)
            }

        }
        console.debug(window.jc_left_data, window.jc_right_data);

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
function getCookie(cookieName) { //here should use trim()
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
// UI elements load 
function getGuessGameBox() {
    let mainBox = document.getElementsByClassName("GuessGameBox");
    for (let i = 0; i < mainBox.length; i++) {
        let divTag = document.createElement("div");
        divTag.setAttribute('style', 'margin-top:-3px;');
        divTag.innerHTML = '<div style="width:130px;height:20px;margin-right:37px;background-color:#EE9A49; border-radius:4px; display:inline-block;" id="show_left_'+i+'">资金池:0</div>';
        divTag.innerHTML += '<div style="width:130px;height:20px;margin-left:37px;background-color:#63B8FF; border-radius:4px; display:inline-block;" id="show_right_'+i+'">资金池:0</div><br/>';
        divTag.innerHTML += "<div style='width:130px;height:20px;background-color:#FF866B; border-radius:4px; display:inline-block;' id='eat_left_" + i + "'>等待秒盘</div>";
        divTag.innerHTML += "<div style='margin:0 7px;width:60px;height:20px;background-color:orange; border-radius:4px; display:inline-block;' id='setup_quiz_" + i + "'>秒盘设置</div>";
        divTag.innerHTML += "<div style='width:130px;height:20px;background-color:#6888FF; border-radius:4px; display:inline-block;' id='eat_right_" + i + "'>等待秒盘</div>";
        mainBox[i].append(divTag);

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

        document.getElementById("setup_quiz_" + i).addEventListener('click', function () {
            setQuizConfig(i)
        });
        document.getElementById("close_btn_" + i).addEventListener('click', function () {
            setQuizConfig(i)
        });
        document.getElementById("clear_btn_" + i).addEventListener('click', function () {
            clearInputContent(this)
        });
        document.getElementById("eat_left_" + i).addEventListener('click', function () {
            eatAllLeftBall(i)
        });
        document.getElementById("eat_right_" + i).addEventListener('click', function () {
            eatAllRightBall(i)
        });
    }
}
// renew wealth pond data(param ins:quizId:竞猜id,isLeft:左右标志,pondMoney:资金池)
function renewMoneyPond(quizId,isLeft,pondMoney){
    let quizObj = document.getElementsByClassName("GuessGameBox");
    if(quizObj.length>0){
        for(let i=0;i<quizObj.length;i++){
            if(quizObj[i].getAttribute("data-qid") == quizId){
                if(isLeft){
                    //console.log('renewMoneyPond',isLeft,i,pondMoney);
                    document.getElementById("show_left_"+i).innerText="资金池:"+pondMoney;
                }else{
                    //console.log('renewMoneyPond',isLeft,i,pondMoney);
                    document.getElementById("show_right_"+i).innerText="资金池:"+pondMoney;
                }
            }
        }
    }
}
// show or hide radio setup
function setQuizConfig(code) {
    // console.info(code);
    let showSwitch = document.getElementById("quiz_window_" + code).style.display;
    if (showSwitch == "none") {
        document.getElementById("quiz_window_" + code).style.display = "inherit";
    } else {
        // if (checkInputValidate(code)) {
        document.getElementById("quiz_window_" + code).style.display = "none";
        // }
    }
}

// check is digital num
function isNumber(num) {
    var reg = new RegExp("^[0-9]*$");
    return reg.test(num);
}
// check is float num 
function isFloat(num) {
    // var reg = new RegExp("^\d+(\.\d+)?$");
    var reg = new RegExp("^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$");
    return reg.test(num);
}
// check the input text is illegal
function checkInputValidate(code) {
    var validateFlag = true;
    let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
    let payRadioStart = elementNode[0].value.trim();
    // let payRadioEnd = elementNode[1].value.trim();
    let payFishBall = elementNode[2].value.trim();
    if ((isNumber(payRadioStart) || isFloat(payRadioStart)) && payRadioStart != "") {
    } else {
        validateFlag = false;
        alert("起始赔率设置错误，请重新输入");
        return validateFlag;
    }
    if (isNumber(payFishBall) && payFishBall != "") {
    } else {
        validateFlag = false;
        alert("鱼丸数量设置错误，请重新输入");
    }
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
var fishBall0 = 0 ,fishBall1 = 0,fishBall2 = 0;
var killLeftTM0, killLeftTM1, killLeftTM2, killRightTM0, killRightTM1, killRightTM2;
var killLeftBtn0 = false, killLeftBtn1 = false, killLeftBtn2 = false, killRightBtn0 = false, killRightBtn1 = false, killRightBtn2 = false;
function eatAllLeftBall(code) {
    let stopBetCheck = document.getElementsByClassName("GuessGameBox")[code].innerText.indexOf("已封盘");
    let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
    let checkValidate = checkInputValidate(code);
    if (checkValidate && stopBetCheck == -1) {
        if (code === 0) {
            killLeftBtn0 = !killLeftBtn0;
            fishBall0 = elementNode[2].value.trim();
            document.getElementById("eat_left_" + code).innerText = killLeftBtn0 ? "正在秒盘" : "等待秒盘";
            if (killLeftBtn0) {
                startToKillBet(code,true);
            } else {
                clearTimeout(killLeftTM0);
            }
        } else if (code === 1) {
            killLeftBtn1 = !killLeftBtn1;
            fishBall1 = elementNode[2].value.trim();
            document.getElementById("eat_left_" + code).innerText = killLeftBtn1 ? "正在秒盘" : "等待秒盘";
            if (killLeftBtn1) {
                startToKillBet(code,true);
            } else {
                clearTimeout(killLeftTM1);
            }
        } else if (code === 2) {
            killLeftBtn2 = !killLeftBtn2;
            fishBall2 = elementNode[2].value.trim();
            document.getElementById("eat_left_" + code).innerText = killLeftBtn2 ? "正在秒盘" : "等待秒盘";
            if (killLeftBtn2) {
                startToKillBet(code,true);
            } else {
                clearTimeout(killLeftTM2);
            }
        }
    } else if (checkValidate && stopBetCheck > -1) {
        alert("已经封盘，无法秒盘");
    }
}
// bet all fish ball on right side
function eatAllRightBall(code) {
    let stopBetCheck = document.getElementsByClassName("GuessGameBox")[code].innerText.indexOf("已封盘");
    let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
    let checkValidate = checkInputValidate(code);
    if (checkValidate && stopBetCheck == -1) {
        if (code === 0) {
            killRightBtn0 = !killRightBtn0;
            fishBall0 = elementNode[2].value.trim();
            document.getElementById("eat_right_" + code).innerText = killRightBtn0 ? "正在秒盘" : "等待秒盘";
            if (killRightBtn0) {
                startToKillBet(code,false);
            } else {
                clearTimeout(killRightTM0);
            }
        } else if (code === 1) {
            killRightBtn1 = !killRightBtn1;
            fishBall1 = elementNode[2].value.trim();
            document.getElementById("eat_right_" + code).innerText = killRightBtn1 ? "正在秒盘" : "等待秒盘";
            if (killRightBtn1) {
                startToKillBet(code,false);
            } else {
                clearTimeout(killRightTM1);
            }
        } else if (code === 2) {
            killRightBtn2 = !killRightBtn2;
            fishBall2 = elementNode[2].value.trim();
            document.getElementById("eat_right_" + code).innerText = killRightBtn2 ? "正在秒盘" : "等待秒盘";
            if (killRightBtn2) {
                startToKillBet(code,false);
            } else {
                clearTimeout(killRightTM2);
            }
        }
    } else if (checkValidate && stopBetCheck > -1) {
        alert("已经封盘，无法秒盘");
    }
}
// clear timeout together
function clearSetupTimeout(code) {
    if (code === 0) {
        clearTimeout(killLeftTM0);
        clearTimeout(killRightTM0);
    } else if (code === 1) {
        clearTimeout(killLeftTM1);
        clearTimeout(killRightTM1);
    } else if (code === 2) {
        clearTimeout(killLeftTM2);
        clearTimeout(killRightTM2);
    }
}
// start kill bet 
function startToKillBet(code,isLeft) {
    let quizObj = document.getElementsByClassName("GuessGameBox")[code].innerHTML;
    if(quizObj.indexOf("已封盘")>-1 || quizObj.indexOf("GuessContItem-failIcon")>-1|| quizObj.indexOf("flowIcon")>-1){//封盘，提前结束，流局
        alert("当前竞猜已经失活，秒盘结束！");
        clearSetupTimeout(code);
    }
    var bankList = [];
    let quizId = document.getElementsByClassName("GuessGameBox")[code].getAttribute("data-qid");
    let elementNode = (document.getElementById("quiz_window_" + code)).getElementsByTagName("input");
    let payRadioStart = elementNode[0].value.trim();
    var jcData = isLeft ? window.jc_left_data : window.jc_right_data;
    console.info("quizId:" + quizId);
    console.info("设置赔率：" + payRadioStart);
    console.info(jcData);
    for (let key in jcData) {
        if (key.indexOf(quizId) > -1) {
            var bankData = jcData[key];
            for (let kk in bankData) {
                if (kk >= payRadioStart * 100) {
                    let tempList = bankData[kk].split('_');
                    bankList.push({
                        "bankId": tempList[0],
                        "pondMoney": tempList[1],
                        "quizId": quizId
                    });
                }
            }
        }
    }
    console.info(bankList);
    loopEatPondMoney(code, bankList, isLeft);
}
// loop to add one eat all wealth pond
function loopEatPondMoney(code, bankList, isLeft) {
    // if (bankList.length == 0) {
    //     console.log("秒盘循环检测中……");
    //     setTimeout(function(){loopEatPondMoney(code, bankList,isLeft)},loomTimeGap);
    // }else{
    //     loopBetRecycle();
    //     console.log("秒盘开始");
    // }
    var num = 0;//first place;
    console.log("秒盘开始");  
    loopBetRecycle();
    function loopBetRecycle() {
        if(code===0){
            if(num === bankList.length){
                if(fishBall0<=0){
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);                    
                }else{
                    if(isLeft){
                        killLeftTM0 = setTimeout(function(){startToKillBet(code,true)},loomTimeGap);
                    }else{
                        killRightTM0 = setTimeout(function(){startToKillBet(code,false)},loomTimeGap);
                    }
                }                    
            }else{
                if(fishBall0 > 0) {
                    console.log("秒盘已执行,剩余鱼丸：" + fishBall0);
                    betQuizRequest(code, fishBall0, bankList[num].quizId, bankList[num].bankId);
                    num++;
                } else {
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);  
                }                    
            }
        }else if(code===1){
            if(num === bankList.length){
                if(fishBall1<=0){
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);                      
                }else{
                    if(isLeft){
                        killLeftTM1 = setTimeout(function(){startToKillBet(code,true)},loomTimeGap);
                    }else{
                        killRightTM1 = setTimeout(function(){startToKillBet(code,false)},loomTimeGap);
                    }
                }                
            }else{
                if(fishBall1 > 0) {
                    console.log("秒盘已执行,剩余鱼丸：" + fishBall1);
                    betQuizRequest(code, fishBall1, bankList[num].quizId, bankList[num].bankId);
                    num++;
                } else {
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);  
                }                    
            }
        }else if(code===2){
            if(num === bankList.length){
                if(fishBall2<=0){
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);                      
                }else{
                    if(isLeft){
                        killLeftTM2 = setTimeout(function(){startToKillBet(code,true)},loomTimeGap);
                    }else{
                        killRightTM2 = setTimeout(function(){startToKillBet(code,false)},loomTimeGap);
                    }
                }              
            }else{
                if(fishBall2 > 0) {
                    console.log("秒盘已执行,剩余鱼丸：" + fishBall2);
                    betQuizRequest(code, fishBall2, bankList[num].quizId, bankList[num].bankId);
                    num++;
                } else {
                    console.info("设置鱼丸已压光,秒盘结束！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);  
                }                    
            }
        }
    }
    // send net request of bet 
    function betQuizRequest(code, payBall, quizId, bankId) {
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
            if (json.error == 0) {
                // chen：这里应该用json.data.balance判断，如果设置的鱼丸数量大于json.data.balance（账户剩余数量），剩余数量应该用json.data.balance
                if(code===0){
                    fishBall0 = fishBall0 - json.data.real_bet_amount;
                    if (fishBall0 > json.data.balance) {
                        fishBall0 = json.data.balance;
                    }
                    console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall0+"】");
                }else if(code===1){
                    fishBall1 = fishBall1 - json.data.real_bet_amount;
                    if (fishBall1 > json.data.balance) {
                        fishBall1 = json.data.balance;
                    }
                    console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall1+"】");
                }else if(code ===2){
                    fishBall2 = fishBall2 - json.data.real_bet_amount;
                    if (fishBall2 > json.data.balance) {
                        fishBall2 = json.data.balance;
                    }
                    console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall2+"】");
                }
                loopBetRecycle();
            }else if(json.error == 283){
                if (json.data.balance==0){
                    alert("鱼丸余额为0，自动退出秒盘！");
                    clearSetupTimeout(code);
                    isLeft?eatAllLeftBall(code):eatAllRightBall(code);
                } else {
                    console.log("鱼丸余额不足，剩余："+ json.data.balance);
                    if(code===0){
                        fishBall0 = json.data.balance;
                        console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall0+"】");
                    }else if(code===1){
                        fishBall1 = json.data.balance;
                        console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall1+"】");
                    }else if(code ===2){
                        fishBall2 = json.data.balance;
                        console.info("赔率为【"+json.data.loss_per_cent/100+"】,已下鱼丸数【"+json.data.real_bet_amount+"】,剩余待下鱼丸数【"+fishBall2+"】");
                    }
                    loopBetRecycle();
                    // chen：这里应该写 下一个循环，并且下注数量用json.data.balance（账号剩余鱼丸数）
                }
            }else if(json.error == 514010){
                console.log("当前赔率已压完，继续秒盘！");
                loopBetRecycle();
            }else {
                console.log("其他错误，继续秒盘！");
                loopBetRecycle();
            }
        }).catch(err => {
            loopBetRecycle();
        })
    }
}
// change window scale
function transformWindowScale(){
    let smallWindowBtn = document.getElementsByClassName("wfs-2a8e83")[0];
    let bigWindowBtn = document.getElementsByClassName("wfs-exit-180268")[0];
    // let smallWindowObject = document.getElementsByClassName("wfs-2a8e83 removed-9d4c42")[0];
    // let bigWindowObject = document.getElementsByClassName("wfs-exit-180268 removed-9d4c42")[0];
    if(smallWindowBtn!=undefined){
        smallWindowBtn.addEventListener('mouseup',windowScaleEventListener);
        bigWindowBtn.addEventListener('mouseup',windowScaleEventListener);        
    }else{
        setTimeout(transformWindowScale,1000);
    }
} 
// listenning changing of windowScale
function windowScaleEventListener(){
    setTimeout(function(){
        var windowScaleObj = document.getElementsByClassName("wfs-exit-180268 removed-9d4c42")[0];//small window
        if(windowScaleObj!=undefined){
            // console.log(1);
            let isLoad = document.getElementById("quiz_window_0");
            let checkLoad = document.getElementsByClassName("GuessGameBox")[0];
            if (checkLoad != undefined && isLoad == undefined) {
                getGuessGameBox();
            }  
        }else{
            // console.log(2);
            let topicRoom = document.getElementsByClassName("GuessIcon")[0];
            let isLoad = document.getElementById("quiz_window_0");
            if (topicRoom != undefined && isLoad == undefined) {
                topicRoom.addEventListener("mouseup", topicRoomLoadGuessUI);//专题直播间绑定按钮
            }            
        }
    },600);        
}
//bind btn event，load quiz windows of topic room
function topicRoomLoadGuessUI() {
    let isLoad = document.getElementById("quiz_window_0");
    let checkLoad = document.getElementsByClassName("GuessGameBox")[0];
    if (isLoad == undefined && checkLoad != undefined) {
        setTimeout(getGuessGameBox, 300);
    } else if (isLoad == undefined && checkLoad == undefined) {
        setTimeout(topicRoomLoadGuessUI, 300);
    }
}
//延迟加载并循环检测页面否有/打开竞猜栏（有则加载，无则检测）
function checkUILoad() {
    transformWindowScale();
    // 专题直播间    
    let topicRoom = document.getElementsByClassName("GuessIcon")[0];
    let isLoad = document.getElementById("quiz_window_0");
    if (topicRoom != undefined && isLoad == undefined && topicRoom.onmouseup==undefined) {
        topicRoom.addEventListener("mouseup", topicRoomLoadGuessUI);//专题直播间绑定按钮
        if(document.URL.indexOf("topic")>-1){
            return ;
        }
    }
    // 普通直播间 (ps:普通直播间开半全屏等价于专题直播间的竞猜页面)
    let checkLoad = document.getElementsByClassName("GuessGameBox")[0];
    if (checkLoad != undefined && isLoad == undefined) {
        getGuessGameBox();
        return ;
    }else{
       setTimeout(checkUILoad, 3000);//轮询执行UI检测，应对用户切换竞猜页面模式
    }
    transformWindowScale();
}
checkUILoad();