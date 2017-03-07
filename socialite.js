
var Socialite =  (function () {
  'use strict';

  var domElements,
    dataBindings;

  Date.prototype.toText = function (){
    return this.toDateString();
  };

  jQuery.fn.goToSection = function (){
    var scrollSpeed = 1000;
    //var goTo =  this.offset().top;
    var goTo = this[0].offsetTop;

    $("#content").stop().animate({ scrollTop: goTo }, scrollSpeed);
  };


  function showError(err){
    alert(err);
  }


  function loadModule(){

    socialite[loadModule.moduleName].init();
  }

  var socialite = {
    cycles: {},
    bdays: {}
  };

  socialite.makeGapiCall = function (request, callback, error){
    request.execute(function(resp){
      if(resp.error){
        if(error)
          showError(error);
        else
          showError("Request to Google calendar failed: " + resp.message);
      }else{
        callback(resp.items || resp.result);
      }
    });
  };

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
    $.getScript( moduleName + ".js", loadModule).fail(function ( jqxhr, settings, exception ) {
       alert("Error loading module: " + exception.message);
    });

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

  socialite.getVal = function(varElement){
      var txt= $(varElement).val();
      return txt;
  };

  socialite.logSession = function(googleUser){
    var profile = googleUser.getBasicProfile();

    var log_entry = {
      user: profile.U3,
      date: new Date(),
      googleProfile:  profile
      //browser: navigator
    }

    $.post("http://socialyte.us/cycles_log",log_entry);
    //$.post("http://localhost:3000/cycles_log",log_entry);
  };

  return socialite;

}());

var gapiLoaded = Socialite.gapiLoaded;
