/*
  Format of calendar description:
 ### DO NOT MODIFY ###
 For use by Socialite 
 hello
 
 
 */
(function (socialite) {
    'use strict';
    
    //GLOBALS
    var currentCalendar, //id of the calendar that is being used to track periods
      lastPeriod, //displayed
      nextPeriod, //displayed
      cycleLength, //displayed
      currentPeriodEventObj,
      correctPeriodStr,
      newInterval,
      eventNickname;
      
    var domElements, dataBindings, makeGapiCall;

       
    //THESE MANIPULATE THE UI

    function addOptionToCalendarMenu(calendarID, calendarName, periodEventName){
      $(domElements.calendarMenuId)
        .append("<li data-id='"+calendarID+"' data-description='"+periodEventName+"'><a href='#'>"+calendarName+"</a></li>");
    }
    
    function createCalendarMenu(currentCalendarName){
    
      addOptionToCalendarMenu(0,"[Create New Calendar]");

        $(domElements.showCalendarMenuBtnId).button("option", "label", currentCalendarName);

        $(domElements.calendarMenuId).menu({
          select: setCurrentCalendar
        });
        
        showUI(domElements.showCalendarMenuBtnId);
     }
      
    function updateButtonText(){
      var label = "Reset Period to every " + newInterval + " days from " + correctPeriodStr;
      $(domElements.executeResetPeriodsBtnId).button("option", "label", label);
    }
    
    function updateMainDetails(){          
      socialite.displayVar("lastPeriod",lastPeriod);          
      socialite.displayVar("nextPeriod",nextPeriod);          
      socialite.displayVar("cycleLength",cycleLength);
    }

    function showUI(domElement){
      //$(domElement).closest(".step").show();
      $(domElement).closest(".section").goToSection();
    }
    
    //JQUERY UI CONTROL
    function setCurrentCalendar(ev,ui){

      currentCalendar = ui.item.data("id");
      
      if(currentCalendar){
        //eventNickname = "me time";
        eventNickname = ui.item.data("description");
        
        $(domElements.showCalendarMenuBtnId).find("span.ui-button-text").text(ui.item.text());
        $(domElements.calendarMenuId).blur();
      
        if(typeof(Storage)!=="undefined"){
          localStorage.currentCalendar=currentCalendar;
        }
      }else {
        showUI(domElements.createCalendarBtn);
      }
    }
        
    function getNextOccurance(eventID){
      var currentDate = new Date();
        
      var request = gapi.client.calendar.events.instances({
          'calendarId': currentCalendar,
          'timeMin': currentDate.toISOString(),
          'eventId': eventID
      });
      
      makeGapiCall(request, function(events) {
        //TO DO: check if the instance is null
          
        var instanceDate = findNext(events);
        nextPeriod = new Date(instanceDate);
        instanceDate.setDate(instanceDate.getDate()-cycleLength);
        lastPeriod = instanceDate;
          
        updateMainDetails();
          
        showUI(dataBindings.lastPeriod);
          
        calculateStatistics();
      }, "failed to find next occurance");
    }

    //makes sure it is actually an upcoming date (and not just that the end date is upcoming)
    function findNext(periodEvents){
      var startDate;
      var i;
      for ( i=0; i < periodEvents.length; i += 1){
        startDate = new Date(periodEvents[i].start.date);
        startDate.setMinutes(0 + startDate.getTimezoneOffset());
      
        if(startDate > new Date()){
      
          return startDate;
        }
      }
      
      return null;
    }

    function updateInterval(){
      newInterval=$(domElements.periodIntervalSpinner).spinner( "value" );
      updateButtonText();
    }
  
    function updateLastPeriod(dateText, inst){
  
      correctPeriodStr=dateText;
      updateButtonText();
    }
  
    function getActualLast(){
  
      var today = new Date(correctPeriodStr);
      if (today>(new Date(lastPeriod))){
        today = new Date(lastPeriod);
        today.setDate(today.getDate()-1);
      }
      var month = ("0" + (today.getMonth()+1)).slice(-2);
      var day = ("0" + today.getDate()).slice(-2);
      return today.getFullYear()+month + day;
    }
    
    function createNewPeriodEvent(){
      var periodStart = new Date(correctPeriodStr);
      var startString = periodStart.toISOString().slice(0,10);
      periodStart.setDate(periodStart.getDate()+5);
      var endString = periodStart.toISOString().slice(0,10);
      var newEvent= {
        summary: eventNickname,
        recurrence: ["RRULE:FREQ=DAILY;INTERVAL=" + newInterval +";"],
        start: {date: startString},
        end: {date: endString}
      };
      var request = gapi.client.calendar.events.insert({
        'calendarId': currentCalendar,
        'resource': newEvent
      });
    
      makeGapiCall(request, function() {
        cycleLength = +newInterval;
        lastPeriod = new Date(correctPeriodStr);
        nextPeriod = new Date(correctPeriodStr);  
        nextPeriod.setDate(lastPeriod.getDate()+cycleLength);
          
        updateMainDetails(); 
          
        $(domElements.resetPeriodsDialog).dialog("close");
        
        showUI(dataBindings.lastPeriod);
      }, "Failed to insert");
    }

    function draw_chart(data){
    
      var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      var x = d3.time.scale()
        .range([0, width]);
        
      var y = d3.scale.linear()
        .range([height, 0]);
        
      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
        
      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
        
      var svg = d3.select(domElements.chartDiv).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
      var formatCount = d3.format(",.0f");
      
      data.forEach(function(d) {
        d.close = +d.close;
      });
      
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0,d3.max(data, function(d) { return d.close; })*1.25]);
      y.nice(15);
      
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
        
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Length (Days)");

      var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.close) + ")"; });
        
      bar.append("rect")
        .attr("x", 1)
        .attr("width", function(d) { return x(new Date(1000*60*60*24*d.close))-x(0) ; })
        .attr("height", function(d) { return height - y(d.close); });
        
      bar.append("line")
        .attr("class", "line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", function(d) { return height - y(d.close); });
        
      bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", function(d) { return x(new Date(1000*60*60*12*d.close))-x(0) ; })
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.close); });
        
      bar.append("text")
        .attr("dy", ".75em")
        .attr("y", function(d) { return (height - y(d.close))/2; })
        .attr("x", 10)
        .attr("text-anchor", "left")
        .text(function(d) { return d.date.toDateString() + " to " + d.cycleEnded.toDateString();  })
        .call(wrap,function(d) { return (x(new Date(1000*60*60*24*d.close))-x(0)) * 2 ; });
    
      $(".bar").mouseover(function (){
        $(this).attr("class","bar info");
      });
      
      $(".bar").mouseout(function (){
        $(this).attr("class","bar");
      });
    }
    
    function wrap(text, width) {
    
      text.each(function(d) {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null)
            .append("tspan")
            .attr("x", 20)
            .attr("y", y)
            .attr("font-family","sans-serif")
            .attr("dy", dy + "em");
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width(d)) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", 20)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .attr("font-family","sans-serif")
              .text(word);
          }
        }
      });
    }
    
    function parseDesc(description){
      if(description){
      var lines = description.split("\n");
      return lines[2];
      }
      return "";
    }

    function listCalendars(){
    
      var request = gapi.client.calendar.calendarList.list({minAccessRole: "owner"});
      
      makeGapiCall(request, function(calendars) {
        var calendarID,
          calendarName,
          periodNickName,
          currentCalendarName;
          
        for (var i = 0; i < calendars.length; i++){
          calendarID = calendars[i].id;
          calendarName = calendars[i].summary;
          periodNickName = parseDesc(calendars[i].description);
          
          addOptionToCalendarMenu(calendarID, calendarName, periodNickName);
          
          if(i===0){
            currentCalendar = calendarID;
            currentCalendarName = calendarName;
            eventNickname = periodNickName;
          }
            
          if((typeof(Storage)!=="undefined")&&(localStorage.currentCalendar)&&(localStorage.currentCalendar==calendarID)){
            currentCalendar = localStorage.currentCalendar;
            currentCalendarName = calendarName;
            eventNickname = periodNickName;
          }
        }
        
        createCalendarMenu(currentCalendarName);

      });
    }
    
    function resetPeriodDialog(){
      setPeriodDialog("Reset", resetPeriod);
    }
        
    function setPeriodDialog(dialogTitle, handler){

      $(domElements.resetPeriodsDialog).attr("title", dialogTitle || "Enter Last Period");
      
      $(domElements.resetPeriodsDialog).dialog({
        width: 700
      });
  
      $(domElements.datePicker).datepicker({
        onSelect: updateLastPeriod
      });
    
      var correctPeriod = lastPeriod || (new Date());
      $(domElements.datePicker).datepicker( "setDate", correctPeriod ); 
      correctPeriodStr =  correctPeriod.toDateString();
    
      $(domElements.executeResetPeriodsBtnId).button().click(handler || createNewPeriodEvent);

      $(domElements.periodIntervalSpinner).spinner({
        change: updateInterval
      });
    
      $(domElements.periodIntervalSpinner).spinner( "value", cycleLength || 28 );
      newInterval = cycleLength;  
      
      $(domElements.resetPeriodsDialog).dialog("open");
    }
  
    function getPeriodEvent(name){
    
      var currentDate = new Date();
    
      var request = gapi.client.calendar.events.list({
        'calendarId': currentCalendar,
        'timeMin': currentDate.toISOString(),
        'q': eventNickname
      });
      
      
      makeGapiCall(request, function(events) {
    

        currentPeriodEventObj = events[0];
        if(currentPeriodEventObj) {
          var eventId = currentPeriodEventObj.id;
          var reccurence = currentPeriodEventObj.recurrence[0];
          reccurence = reccurence.slice(reccurence.search("INTERVAL=")).split(";")[0];
          cycleLength = reccurence.split("=")[1];
          
          getNextOccurance(eventId);
        }else {
          setPeriodDialog();
        }

      }, "failed to find event '"+name+"'");
    }

    function createCalendar(){
    
      var newCalendarName = socialite.getVal(dataBindings.newCalendarName);
      var periodNickname = socialite.getVal(dataBindings.periodNickname);
      
      var desc = "\
 ### DO NOT MODIFY ###\n\
 For use by Socialite: \n" + periodNickname;
    
      var request = gapi.client.calendar.calendars.insert({
        'summary': newCalendarName,
        'description': desc
      });
      
      makeGapiCall(request, function(newCalendar) {
      
        $(domElements.calendarMenuId).hide();
        $(domElements.calendarMenuId).menu( "destroy" );
        $(domElements.calendarMenuId + " li").last().remove();
        currentCalendar = newCalendar.id;
        //eventNickname = newCalendar.description;
        eventNickname = periodNickname;
        var currentCalendarName =  newCalendar.summary;
        addOptionToCalendarMenu(currentCalendar, currentCalendarName);   
        createCalendarMenu(currentCalendarName);
        showUI(domElements.showCalendarMenuBtnId);
        
      },"Failed to create new calendar");
    }
    
    function resetPeriod(){
      currentPeriodEventObj.recurrence[0]+= (";UNTIL="+ getActualLast());
      currentPeriodEventObj.sequence++;
      
      var request = gapi.client.calendar.events.update({
        'calendarId': currentCalendar,
        'eventId': currentPeriodEventObj.id,
        'resource': currentPeriodEventObj
      });
    
      makeGapiCall(
        request, 
        createNewPeriodEvent,
        "Failed to delete old period event."
      );
    }
  
    function calculateStatistics(){
      var currentDate = new Date(),
        yearAgo = new Date();
        
      yearAgo.setFullYear(currentDate.getFullYear()-1);
      
      var request = gapi.client.calendar.events.list({
        'calendarId': currentCalendar,
        'timeMin': yearAgo.toISOString(),
        'timeMax': currentDate.toISOString(),
        'q': eventNickname,
        'singleEvents': true
      });
      
      makeGapiCall(request, function(events) {
        var periodDate,
          length,
          lengths = 0,
          totalPeriodsCnt = events.length,
          lastDate;
            
        var data=[];
        
        for (var i=0; i < totalPeriodsCnt; i++){
          periodDate = new Date(events[i].start.date);
          
          if (i>0) {
            length = (periodDate-lastDate)/((24*3600*1000));
            lengths += length;
            data[i-1] = {
              date: lastDate,
              close: length,
              cycleEnded: periodDate
            };
          }
          lastDate = periodDate;
        }
        
        var avg= lengths/(totalPeriodsCnt-1);
        avg = Math.round(avg * 100) / 100;

        socialite.displayVar("avgCycleLength",avg);
          
        draw_chart(data);
        }, "Failed to find period events");
    }
    
    var cycle = {};

    cycle.init = function () {

      domElements = socialite.domElements;
      dataBindings = socialite.dataBindings;
      makeGapiCall = socialite.makeGapiCall;
      
      socialite.loadGapi("calendar", listCalendars);
    
      $(domElements.resetPeriodsBtnId).button().click(resetPeriodDialog);
      $(domElements.trackPeriodsBtnId).button().click(getPeriodEvent);
      $(domElements.createCalendarBtn).button().click(createCalendar);
      
      
      $(domElements.showCalendarMenuBtnId)
        .button({
          label: "test",
          icons: {
            secondary: "ui-icon-triangle-1-s"
          }
        })
        .click(function() {
          var menu = $(domElements.calendarMenuId)
            .show()
            .position({
              my: "left top",
              at: "left bottom",
              of: this
            });
            
          $( document ).one( "click", function() {
            menu.hide();
          }); 
          return false;
        });
    };

    socialite.cycle = cycle;

  }(Socialite));

//@ sourceURL=cycle.js
