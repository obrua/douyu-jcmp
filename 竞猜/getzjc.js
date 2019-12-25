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
window.jc_left_data={}
window.jc_right_data={}

window.socketProxy.socketStream.subscribe(
  'rquizisn',
  function (data) {
    let jc_data = deserialize(data.qril);
    console.debug(jc_data)
    for(i in jc_data) {
      let item = jc_data[i];

      if (item.solpc==0) {
        //倍率为0 排除
        continue
      }
      let pidkey = 'qid_' + item.qid;
      let qiditem = {};
      if (window.jc_left_data.hasOwnProperty(pidkey)) {
        qiditem[item.folpc] = item.fbid+'_'+item.fbmc
        window.jc_left_data[pidkey] = { ...window.jc_left_data[pidkey], ...qiditem }
      } else {
        qiditem[item.folpc] = item.fbid+'_'+item.fbmc
        window.jc_left_data[pidkey] = qiditem
      }
      if (window.jc_right_data.hasOwnProperty(pidkey)) {
        qiditem[item.solpc] = item.sbid+'_'+item.sbmc
        window.jc_left_data[pidkey] = { ...window.jc_left_data[pidkey], ...qiditem }
      } else {
        qiditem[item.solpc] = item.sbid+'_'+item.sbmc
        window.jc_right_data[pidkey] = qiditem
      }

    }
    console.debug(window.jc_left_data, window.jc_right_data)

  }
);


window.socketProxy.socketStream.subscribe(
  'rquiziln', 
  function(data) {
    console.log('rquiziln','重新开猜');
    console.debug('rquiziln', data);
    window.jc_left_data={};
    window.jc_right_data={};
  }
);

