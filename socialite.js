
var Socialite =  (function () {
  'use strict';
  
  var domElements,
    dataBindings;
  
  Date.prototype.toText = function (){
    return this.toDateString();
  };
  
  function showError(err){
    alert(err);
  }
    

  
  function callGapi(request, callback, error){
    request.execute(function(resp){
      if(resp.error){ 
        if(error)
          showError(error);
        else
          showError("Request to Google calendar failed: " + resp.message);
      }else{    
        callback();
      }
    });
  }
  
  function loadModule(){
  
    socialite[loadModule.moduleName].init();  
  }
 
  var socialite = {
    cycles: {},
    bdays: {}
  };
  
  jQuery.fn.goToSection = function (){
    var scrollSpeed = 1000;
    //var goTo =  this.offset().top;
    var goTo = this[0].offsetTop;
    
    $("#content").stop().animate({ scrollTop: goTo }, scrollSpeed);
    
  }
  
  socialite.init = function (moduleName, dom, db) {
      
    dataBindings = db;
    domElements = dom;  
        
    socialite.dataBindings = db;
    socialite.domElements = dom;
    
    for(var el in domElements){
      domElements[el] = "#"+domElements[el];
    }

    for(var el in dataBindings){
      dataBindings[el] = "#"+dataBindings[el];
    }

    loadModule.moduleName= moduleName;
    $.getScript( moduleName + ".js", loadModule);

  };
  
  socialite.loadGapi = function (gapiName, callBack, scope){
    $.ajaxSetup({ cache: true});
    $.getScript( "https://apis.google.com/js/client:plusone.js?onload=gapiLoaded");
    handleAuthResult.callBack = callBack;
    handleAuthResult.gapiName = gapiName;
    gapiAuthorize.scope = scope || ('https://www.googleapis.com/auth/'+gapiName);
    
  };

  function gapiAuthorize(immediate){
    gapi.auth.authorize( {
        'client_id': '236313466679-j8jhaf0h99u63c2523gr45mtgdsbrgi7.apps.googleusercontent.com',
        'scope': gapiAuthorize.scope,
        'immediate': immediate
      }, handleAuthResult);
  }

  socialite.gapiLoaded = function (){
    gapi.client.setApiKey('AIzaSyBLYlu4hbmzhr1iOCiD_o2PTrjzvQBuQUA');
    gapiAuthorize(true);
  };

  function handleAuthResult (authResult) {
  
    if (authResult && !authResult.error) {
      gapi.client.load( handleAuthResult.gapiName, 'v3', handleAuthResult.callBack);
    } else {
      gapiAuthorize(false);
    }
  }
  
  socialite.displayVar = function(varName,varVal){
      var txt ="";
      if ((typeof(varVal)=="object"))
        txt = varVal.toText();
      else
        txt = varVal;
      $(dataBindings[varName]).text(txt);
      
  };
 
  return socialite;
  
}());  

var gapiLoaded = Socialite.gapiLoaded;  

