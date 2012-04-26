var log = function(obj) {
  console.log(obj);
};

var update_memories = function(m) {
  localStorage.memories = JSON.stringify(m);
};

var get_memories = function(){
  if( ! localStorage.memories ) {
    return {};
  }
  return JSON.parse(localStorage.memories);
};

//tab打开时，传送scroll 百分比
chrome.tabs.onUpdated.addListener(function(tabId , updateInfo , tab) {
  var loc = tab.url;
  //更新数据
  var memories = get_memories();
  //show page action while tab is open
  //TODO:建立显示page action的规则
  chrome.pageAction.show(tabId);
  if( memories[loc] ) {
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
    console.log('no data for ' + loc);
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
    chrome.pageAction.setIcon({
      'tabId' : tab.id,
      path : 'auto_scroll_16.png'
    });
  } else {
    log('remember' + loc);
    chrome.pageAction.setIcon({
      'tabId' : tab.id,
      path : 'auto_scroll_active_16.png'
    });
    memories[loc] = {'percent' : 0};
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
