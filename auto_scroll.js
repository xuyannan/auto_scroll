var loc = window.location.href;
var memory = {
  'loc' : loc,
  'percent' : 0
};
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log('auto scroll : ' + request.percent);
    setTimeout(function(){
      var percent = request.percent;
      var height = document.body.scrollTop;
      var scrollHeight = document.body.scrollHeight;
      if(height / scrollHeight == percent) {
        return false;
      }
      document.body.scrollTop = scrollHeight * percent;
    } , 1000);
;
    //sendResponse({farewell: "goodbye"});
});
window.onscroll = function() {
  var height = document.body.scrollTop;
  var scrollHeight = document.body.scrollHeight;
  memory.percent = height / scrollHeight
  chrome.extension.sendRequest({'greeting' : "hello" , 'memory': JSON.stringify(memory)}, function(response) {
    //console.log(response);
  });
}

