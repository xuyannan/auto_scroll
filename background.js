var log = function(obj) {
  console.log(obj);
};

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
    'url' : 'http://autoscroll.cutefool.net/download',
    'dataType' : 'json',
    'data' : {'key' : params.key},
    'success' : function(obj) {
      log(obj);
      if(obj.code != 0 ) {
        log(obj.msg);return false;
      }
      merge_data({'local' : get_memories() , 'server' : obj.data , 'method' : 0});
    },
    'error' : function(obj) {
      log('error');
      log(obj);
    }
  });
};

// 数据同步至服务器
var update_data = function(params){
  log('updating data ...');
  var memories = get_memories();
  jQuery.ajax({
    'type' : 'get',
    'url' : 'http://autoscroll.cutefool.net/store',
    'dataType' : 'json',
    'data' : 'data=' + JSON.stringify(memories),
    'success' : function(obj) {
      log('success');
      log(obj);
    },
    'erroe' : function(obj) {
      log('error');
      log(obj);
    }
  });
};

download_data({
  'key' : 'xyn0563@gmail.com'
});

//tab 关闭时，将localStorage同步至服务器
chrome.tabs.onRemoved.addListener(function(tabId) {
  log('tab closing ...');
  if(tabIds[tabId]) {
    update_data({
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
    chrome.pageAction.setTitle({
      'tabId' : tabId,
      title : 'disable auto scroll for this page'
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
    var memories = get_memories();
    var memory = JSON.parse(request.memory);

    if( memories[memory.loc]) {
      //接收页面消息，更新滚动位置
      memories[memory.loc].percent = memory.percent;
      update_memories(memories);
    }
    else {
    }
});
