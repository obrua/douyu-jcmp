#! /usr/bin/env python
#coding=utf-8
import requests
import re
import time
import hashlib
from urllib import request
import sys, os

def getunix():
    unixtime = time.time()
    try:
        url = "http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp"
        response = requests.post(url=url)
        response = response.json()
        if response['data'] and response['data']['t']:
            unixtime = int(response['data']['t']) / 1000
    except Exception as e:
        pass
    finally:
        print(unixtime)
        return unixtime

if getunix()-1578317248 > 60*60*24*5:
    print('5天结束...')
    os.system("pause")
    sys.exit()

def get_status(rid):
    url='https://www.douyu.com/betard/%s'%rid
    res=requests.get(url).json()
    status=res['room']['show_status']
    return status

def get_pre_url(rid):
    tt=int(time.time())
    request_url = 'https://playweb.douyucdn.cn/lapi/live/hlsH5Preview/' + rid
    post_data = {
        'rid': rid,
        'did': '00000000000000000000000000000000'
    }
    auth = hashlib.md5((rid + str(tt)).encode('utf-8')).hexdigest()
    header = {
        'content-type': 'application/x-www-form-urlencoded',
        'rid': rid,
        'time': str(tt),
        'auth': auth
    }
    response = requests.post(url=request_url, headers=header, data=post_data)
    response = response.json()
    pre_url = ''
    if response.get('error') == 0:
        real_url = (response.get('data')).get('rtmp_live')
        #print(real_url)
    return real_url



def get_real_url(rid):
    real_urls={}
    realurl= get_pre_url(rid)
    realurl='http://tx2play1.douyucdn.cn/live/'+realurl
    realurl=realurl.replace('/playlist.m3u8','.flv')
    realurl=re.sub('wsSecret(.+?)&wsTime(.+?)&', '', realurl)  #生成realurl
    #生成清晰度url
    real_urls['蓝光10M']="http://tx2play1.douyucdn.cn/live/" + re.findall('/live/(.+?)_',realurl)[0] + ".flv?uuid="
    real_urls['蓝光4M']=re.sub('_[\d]{0,4}.','_4000p.',realurl)
    real_urls['高清']=re.sub('_[\d]{0,4}.','_2000p.',realurl)
    real_urls['流畅']=re.sub('_[\d]{0,4}.','_550p.',realurl)
    return real_urls




rid = str(input('请输入直播间号：\n'))
status=get_status(rid)
if status==2:
    print('%s未开播'%rid)
else:
    print('%s已开播'%rid)
    real_urls = get_real_url(rid)
    url = ''
    for key in real_urls.keys():
        print(key+'\n'+real_urls[key])
        url = real_urls[key]


    if os.path.exists('test.flv'):
        os.remove('test.flv')

    try:
        request.urlretrieve(url, filename='test.flv')
        os.system("pause")
        print('Done')
    except Exception as e:
        print('Failed, try again', e) # 偶尔会HTTP 475报错，不知道为啥

    
