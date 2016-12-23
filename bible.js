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
    
    function showUI(domElement){
      //$(domElement).closest(".step").show();
      $(domElement).closest(".section").goToSection();
    }
    

    function draw_chart(data){
    
      var divisions_str = "\
book,color\n\
Joshua,Orange\n\
Job,Yellow\n\
Isaiah, Green\n\
Hosea, Blue\n\
Matthew, Purple\n\
Romans, Red\n\
Hebrews, Orange\n\
Revelation, Yellow\n";
    
      var margin = {top: 20, right: 200, bottom: 30, left: 100},
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      var x = d3.time.scale()
        .range([0, width]);

      var y = d3.scale.ordinal()
        .rangePoints([ height, 0]);
        
      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
        
      var yAxis = d3.svg.axis()
        .scale(y)
        .tickValues(["Joshua 1:1", "Proverbs 1:1", "Matthew 1:1", "James 1:1"])
        .orient("left");
        
      var svg = d3.select(domElements.chartDiv).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
      var formatCount = d3.format(",.0f");
      
      var startDate = new Date();
      var endDate = new Date(0);
      data.forEach(function(d) {
        d.close = d.reference;
        d.date = new Date(d.date);
        if (d.date<startDate) startDate = d.date;
        if (d.date>endDate) endDate = d.date;
      });
      
      startDate.setMonth(startDate.getMonth()-1);
      x.domain([startDate, endDate]);
      y.domain(bible.verses);
      
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


      var divisions = d3.csv.parse(divisions_str);
      
      var last_y=height;
      for (var i=0; i<divisions.length; i++){
        var reference = divisions[i].book + " 1:1";
        var division_y = y(reference);
        svg.append("rect")
          .attr("fill", divisions[i].color)
          .attr("y",division_y)
          .attr("x",0)
          .attr("width",width)
          .attr("fill-opacity",0.25)
          .attr("height", last_y-division_y);
        last_y = division_y;
        
        svg.append("text")
          .attr("y",division_y-5)
          .attr("x",5)
          .style("font-size", 10)
          .style("font-family","'Michroma', sans-serif")
          .attr("text-anchor", "left")
          .attr("fill-opacity",0.5)
          .text( divisions[i].book);
      }

        
      var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.close) + ")"; });
    
      bar.append("circle")
        .attr("class", "dots")
        .attr("r", 4)
        .attr("cx", 0)
        .attr("cy", 0)
        .on("click", function(d) {
            window.open("https://www.bible.com/bible/"+d.verse_url, '_blank');
        });

      bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6 )
        .attr("x", 10)
        .style("font-size", 10)
        .attr("text-anchor", "left")
        .text(function(d) { return d.reference + " - " + d.date.toDateString();  });

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

    function calculateStatistics(){
      var currentDate = new Date(),
        yearAgo = new Date();
        
      yearAgo.setFullYear(currentDate.getFullYear()-1);


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

    }
    
    function readVersesCallback(error, json) {
        if (error) return console.warn(error);
        bible.verses = json;
        
        d3.csv("/socialite/bible/data.csv", draw_chart);
    }
    
    var bible = {};

    bible.init = function () {

      domElements = socialite.domElements;
      dataBindings = socialite.dataBindings;
      makeGapiCall = socialite.makeGapiCall;
      
      //showUI(domElements.showCalendarMenuBtnId);
      
      d3.json("/socialite/bible/verses_list.json",readVersesCallback);

 
    };

    socialite.bible = bible;

  }(Socialite));

//# sourceURL=bible.js
