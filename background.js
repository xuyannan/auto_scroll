var log = function(obj) {
  console.log(obj);
};
var memories = undefined;
if( ! localStorage.memories) {
  log('init memories');
  memories = {};
}else {
  memories = JSON.parse(localStorage.memories);
}

//tab打开时，传送scroll 百分比
//chrome.tabs.onCreated.addListener(function(tab) {
  chrome.tabs.onUpdated.addListener(function(tabId , updateInfo , tab) {
    var loc = tab.url;
    //if(!loc) {log("no url");return false;}
    if( memories[loc] && memories[loc].percent ) {
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
    }
  });
//});


chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var memory = JSON.parse(request.memory);

    if( memories[memory.loc] && memories[memory.loc].percent) {
    }
    else {
      memories[memory.loc] = {percent : 0};
    }
    //接收页面消息，更新滚动位置
    memories[memory.loc].percent = memory.percent;
    localStorage.memories = JSON.stringify(memories);
});
