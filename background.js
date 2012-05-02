
var log = function(obj) {
  console.log(obj);
};
var settings = {
  'getToken' : function(){
      return localStorage.token ? localStorage.token : undefined;
  },
  'setToken' : function(token) {
      if(token) {
        localStorage.token = token;
      }
  }
};

var logout = function() {
    log('log out ...');
    localStorage.token = undefined;
    localStorage.memories = undefined;
    delete localStorage.token;
    delete localStorage.memories;
};

var BASE_URL = 'http://autoscroll.cutefool.net';
//var BASE_URL = 'http://localhost:8081';

var tabIds = {};

var update_memories = function(m) {
  localStorage.memories = JSON.stringify(m);
};

var get_memories = function(){
  if( ! localStorage.memories ) {
    return {};
  }
  return JSON.parse(localStorage.memories);
};

//判断是否空对象
var is_empty_object = function(obj) {
  for( m in obj ) {
    return false;
  }
  return true;
};

var merge_data = function(params){
//method:0:使用server的数据，1,使用本地数据, 2,merge
  if(params.method == 0) {
    update_memories(params.server);
  }else if(params.method == 1 ) {
    update_memories(params.local);
  }else if(params.method == 2 ) {
    //TODO:how to merge?
    update_memories(params.server);
  }
};

// download memories from server
var download_data = function(params){
  jQuery.ajax({
    'type' : 'get',
    'url' : BASE_URL + '/download',
    'dataType' : 'json',
    'data' : {'key' : params.key},
    'success' : function(obj) {
      if(obj.code != 0 ) {
        log(obj.msg);return false;
      }

      merge_data({'local' : get_memories() , 'server' : JSON.parse(obj.data) , 'method' : 0});
      if( !is_empty_object(get_memories()) ) {
        log('local data is not empty');
      }
    },
    'error' : function(obj) {
      log('error');
    }
  });
};

// 数据同步至服务器
var upload_data = function(params){
  log('uploading data ...');
  var memories = get_memories();
  jQuery.ajax({
    'type' : 'get',
    'url' : BASE_URL + '/upload',
    'dataType' : 'json',
    'data' : {'token' : params.token , 'data' : JSON.stringify(memories)},
    'success' : function(obj) {
      log('upload success');
    },
    'erroe' : function(obj) {
      log('upload error');
    }
  });
};

if(localStorage.token) {
  download_data({
    'key' : localStorage.token 
  });
}

//tab 关闭时，将localStorage同步至服务器
chrome.tabs.onRemoved.addListener(function(tabId) {
  if(tabIds[tabId] && localStorage.token) {
    upload_data({
      'token' : localStorage.token
    });
  }
});

//tab打开时，传送scroll 百分比
chrome.tabs.onUpdated.addListener(function(tabId , updateInfo , tab) {
  var loc = tab.url;
  //更新数据
  var memories = get_memories();//为啥还要再parse一下？
  //show page action while tab is open
  //TODO:建立显示page action的规则
  chrome.pageAction.show(tabId);
  if( memories[loc] ) {
    tabIds[tabId] = 1;//记录tabId，标识是被记录的页面
    chrome.pageAction.setIcon({
      'tabId' : tabId,
      path : 'auto_scroll_active_16.png'
    });
    chrome.pageAction.show(tabId);
    chrome.pageAction.setTitle({
      'tabId' : tabId,
      'title' : 'disable auto scroll for this page'
    });
    if( !memories[loc].percent ) {
      log('forget ' + loc);
      return false;
    }

    console.log('sending message to tab ...');
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, {percent: memories[loc].percent}, function(response) {
        chrome.tabs.executeScript(tab.id, {
          'file' : 'auto_scroll.js'
        });
      });
    });
  } else {
    //console.log('no data for ' + loc);
    chrome.pageAction.setTitle({
      'tabId' : tabId,
      title : 'enable auto scroll for this page'
    });
    chrome.pageAction.show(tabId);
  }
});

//点击事件
chrome.pageAction.onClicked.addListener(function(tab) {
  var loc = tab.url;
  var memories = get_memories();
  if(memories[loc]) {
    log('clear memory of ' + loc);
    memories[loc] = undefined;
    delete memories[loc];
    delete tabIds[tab.id];
    chrome.pageAction.setIcon({
      'tabId' : tab.id,
      path : 'auto_scroll_16.png'
    });
  } else {
    log('remember ' + loc);
    chrome.pageAction.setIcon({
      'tabId' : tab.id,
      path : 'auto_scroll_active_16.png'
    });
    memories[loc] = {'percent' : 0};
    tabIds[tab.id] = 1;
  }
  update_memories(memories);
});
//接收页面传来的数据
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if(request.page && request.page == 'options') {
      localStorage.token = request.token;
      //登录完成后共获取数据
      log('download data ...');
      download_data({
        'key' : localStorage.token 
      });
    }else {
      var memories = get_memories();
      var memory = JSON.parse(request.memory);

      if( memories[memory.loc]) {
        //接收页面消息，更新滚动位置
        memories[memory.loc].percent = memory.percent;
        update_memories(memories);
      }
      else {
      }
    
    }
});
