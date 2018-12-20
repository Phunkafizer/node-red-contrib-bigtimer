/**
 * This node is copyright (c) Peter Scargill - but as I've had so many ideas from others -
 * consider it free to use for whatever purpose you like. If you redesign it
 * please remember to drop my name and link in there somewhere.
 * http://tech.scargill.net 
 */

module.exports = function(RED) {
	"use strict";
	var SunCalc = require('suncalc');
	
	function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
	
	function randomInt (low, high) {
    var m=Math.floor(Math.random() * (Math.abs(high) - low) + low);
	if (high<=0) return -m; else return m;
}

function dayinmonth(date,weekday,n) // date, weekday (1-7) week of the month (1-5)
{
	if (n > 0)
		{
			return ((Math.ceil((date.getDate()) / 7) == n) && (date.getDay() == weekday - 1));
		}
	else
		{
		var last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			return (Math.ceil(last.getDate()/7) == Math.ceil(date.getDate()/7) && (date.getDay() == weekday - 1));
		}
}
	
	function bigTimerNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
	
        var stopped=0;
		
		var ismanual=-1;
		var timeout=0;
		var startDone=0;
		
		var onlyManual=0; 
		
		node.name=n.name;
		node.lat = n.lat;
		node.lon = n.lon;
		node.offs = n.offs;
		node.startT = n.starttime;
		node.endT = n.endtime;
		node.startOff = n.startoff;
		node.endOff = n.endoff;
		node.outtopic = n.outtopic;
		node.outPayload1 = n.outpayload1;
		node.outPayload2 = n.outpayload2;
		node.outText1 = n.outtext1;
		node.outText2 = n.outtext2;
		node.timeout = n.timeout;
		node.sun = n.sun;
		node.mon = n.mon;
		node.tue = n.tue;
		node.wed = n.wed;
		node.thu = n.thu;
		node.fri = n.fri;
		node.sat = n.sat;
		node.jan = n.jan;
		node.feb = n.feb;
		node.mar = n.mar;
		node.apr = n.apr;
		node.may = n.may;
		node.jun = n.jun;
		node.jul = n.jul;
		node.aug = n.aug;
		node.sep = n.sep;
		node.oct = n.oct;
		node.nov = n.nov;
		node.dec = n.dec;
		
		node.day1=n.day1;
		node.month1=n.month1;
		node.day2=n.day2;
		node.month2=n.month2;
		node.day3=n.day3;
		node.month3=n.month3;
		node.day4=n.day4;
		node.month4=n.month4;
		node.day5=n.day5;
		node.month5=n.month5;
		
		node.suspend=n.suspend;
		node.random=n.random;
		node.repeat=n.repeat;
		node.atStart=n.atstart;
		
		node.d1=n.d1;
		node.w1=n.w1;
		node.d2=n.d2;
		node.w2=n.w2;
		node.d3=n.d3;
		node.w3=n.w3;
		node.d4=n.d4;
		node.w4=n.w4;
		node.d5=n.d5;
		node.w5=n.w5;
		
	    var goodDay=0;
		
		var temporaryManual=0;
		var permanentManual=0;
		
		var playit = 0;
		var newEndTime = 0;
		
		var actualStartOffset=0;
		var actualEndOffset=0;

		var actualStartTime=0;
		var actualEndTime=0;
		
		var manualState=0;
		var autoState=0;
		var lastState=-1;
		var actualState=0;
		
		var change=0;
		
					
		node
				.on(
						"input",
						function(inmsg) {
							var now = new Date(); // UTC time - not local time
							// this is the place to add an offset
							now.setHours(now.getHours()+parseInt(node.offs, 10));
							//var nowOff = -now.getTimezoneOffset() * 60000;	// local offset		
							var times = SunCalc.getTimes(now, node.lat,node.lon);	// get this from UTC, not local time

							var dawn=(times.dawn.getHours()*60) + times.dawn.getMinutes();
							var dusk=(times.dusk.getHours()*60) + times.dusk.getMinutes();
							
							var solarNoon=(times.solarNoon.getHours()*60) + times.solarNoon.getMinutes();

							var sunrise=(times.sunrise.getHours()*60) + times.sunrise.getMinutes();
							var sunset=(times.sunset.getHours()*60) + times.sunset.getMinutes();

							var night=(times.night.getHours()*60) + times.night.getMinutes();
							var nightEnd=(times.nightEnd.getHours()*60) + times.nightEnd.getMinutes();
							
						   // now=new Date(now+nowOff); // from now on we're working on local time		
							var today=(now.getHours()*60) + now.getMinutes();							
							var startTime = parseInt(node.startT, 10);
							var endTime = parseInt(node.endT, 10);
							
							var outmsg = {
								payload : "",
								topic : ""
							};
							var outmsg2 = {
								payload : "",
								reference : node.outtopic+":"+node.outPayload1+":"+node.outPayload2 + ":" + today,
								topic : "status",
								state : "",
								time : "",
								name : ""
							};
							var outtext = {
								payload : "",
								topic : ""
							};

							if (actualStartOffset==0)
								{ if (node.random) actualStartOffset=randomInt(0,node.startOff); else actualStartOffset=node.startOff; }

							if (actualEndOffset==0)
								{ if (node.random) actualEndOffset=randomInt(0,node.endOff); else actualEndOffset=node.endOff; }					

							if (startTime == 5000) startTime = dawn;
							if (startTime == 5001) startTime = dusk;
							if (startTime == 5002) startTime = solarNoon;
							if (startTime == 5003) startTime = sunrise;
							if (startTime == 5004) startTime = sunset;
							if (startTime == 5005) startTime = night;
							if (startTime == 5006) startTime = nightEnd;

							if (endTime == 5000) endTime = dawn;
							if (endTime == 5001) endTime = dusk;
							if (endTime == 5002) endTime = solarNoon;
							if (endTime == 5003) endTime = sunrise;
							if (endTime == 5004) endTime = sunset;
							if (endTime == 5005) endTime = night;
							if (endTime == 5006) endTime = nightEnd;
							
							if (endTime == 10001) endTime = (startTime+1)%1440;
							if (endTime == 10002) endTime = (startTime+2)%1440;
							if (endTime == 10005) endTime = (startTime+5)%1440;
							if (endTime == 10010) endTime = (startTime+10)%1440;
							if (endTime == 10015) endTime = (startTime+15)%1440;
							if (endTime == 10030) endTime = (startTime+30)%1440;
							if (endTime == 10060) endTime = (startTime+60)%1440;
							if (endTime == 10090) endTime = (startTime+90)%1440;
							if (endTime == 10120) endTime = (startTime+120)%1440;
							
							actualStartTime=(startTime+Number(actualStartOffset))%1440;  
							actualEndTime= (endTime+Number(actualEndOffset))%1440; 
			
							autoState = 0; goodDay=0;
							switch (now.getDay()) {
							case 0:
								if (node.sun)
									autoState=1;
								break;
							case 1:
								if (node.mon)
									autoState=1; ;
								break;
							case 2:
								if (node.tue)
									autoState=1;
								break;
							case 3:
								if (node.wed)
									autoState=1; 
								break;
							case 4:
								if (node.thu)
									autoState=1;
								break;
							case 5:
								if (node.fri)
									autoState=1; 
								break;
							case 6:
								if (node.sat)
									autoState=1;
								break;
							}

							if (autoState)
							{ 
							autoState=0;
						    switch (now.getMonth()) {
								case 0:
									if (node.jan)
										autoState=1;
									break;
								case 1:
									if (node.feb)
										autoState=1;
									break;
								case 2:
									if (node.mar)
										autoState=1;
									break;
								case 3:
									if (node.apr)
										autoState=1;
									break;
								case 4:
									if (node.may)
										autoState=1;
									break;
								case 5:
									if (node.jun)
										autoState=1;
									break;
								case 6:
									if (node.jul)
										autoState=1;
									break;
								case 7:
									if (node.aug)
										autoState=1;
									break;
								case 8:
									if (node.sep)
										autoState=1;
									break;
								case 9:
									if (node.oct)
										autoState=1;
									break;
								case 10:
									if (node.nov)
										autoState=1;
									break;
								case 11:
									if (node.dec)
										autoState=1;
									break;
								}
								
							}

							if ((node.day1==now.getDate())&& (node.month1==(now.getMonth()+1))) autoState=1;
							if ((node.day2==now.getDate())&& (node.month2==(now.getMonth()+1))) autoState=1;
							if ((node.day3==now.getDate())&& (node.month3==(now.getMonth()+1))) autoState=1;
							if ((node.day4==now.getDate())&& (node.month4==(now.getMonth()+1))) autoState=1;
							if ((node.day5==now.getDate())&& (node.month5==(now.getMonth()+1))) autoState=1;
								
							if (dayinmonth(now,node.d1,node.w1)==true) autoState=1;
							if (dayinmonth(now,node.d2,node.w2)==true) autoState=1;
							if (dayinmonth(now,node.d3,node.w3)==true) autoState=1;
							if (dayinmonth(now,node.d4,node.w4)==true) autoState=1;
							if (dayinmonth(now,node.d5,node.w5)==true) autoState=1;
	
							if (autoState==1) goodDay=1; 
							
							// if autoState==1 at this point - we are in the right day and right month or in a special day
							// now we check the time

							if (autoState==1) // have to handle midnight wrap
							{
								autoState=0;
								if (actualStartTime <= actualEndTime) {
									if ((today >= actualStartTime) && (today < actualEndTime))
										autoState=1;
								} else // right we are in an overlap situation
									{					
									if (((today >= actualStartTime) || (today < actualEndTime)))
										autoState=1;
								}
							}

							// autoState is 1 or 0 or would be on auto.... has anything changed...
							change=0;
							
							if ((node.atStart==0)&&(startDone==0)) lastState=autoState; // that is - no output at the start if node.atStart is not ticked
							
							if (autoState!=lastState) // there's a change of auto
								{
								 lastState=autoState; change=1;  // make a change happen and kill temporary manual
								 if (autoState==1) actualEndOffset=0; else actualStartOffset=0; // if turning on - reset random offset for next OFF time else reset offset for next ON time
								 temporaryManual=0; // kill temporaryManual (but not permanentManual) as we've changed to next auto state
								}
							
							// manual override
							if (inmsg.payload>"")
							switch (inmsg.payload.toLowerCase())
							{
								case "sync": goodDay=1; change=1; break;
								case "on"  :
								case "1"   : if ( permanentManual==0) temporaryManual=1; 
											 timeout=node.timeout; change=1; manualState=1;  stopped=0; break;
								case "off" :
								case "0"   : if ( permanentManual==0) temporaryManual=1; 
								             timeout=node.timeout; change=1; manualState=0;  stopped=0; break;
								case "default" :
								case "auto" : temporaryManual=0; permanentManual=0; change=1;  stopped=0; break;
								case "manual" : if ((temporaryManual==0) && (permanentManual==0))  manualState=autoState;
												temporaryManual=0; permanentManual=1; change=1; stopped=0; break;
								case "stop" : stopped=1;
								default :  break;
							}



							if (temporaryManual || permanentManual) // auto does not time out.
								{
								if (timeout) {
											if ((--timeout)==0) 
												{
													manualState=autoState; // turn the output to auto state after X minutes of any kind of manual operation
													temporaryManual=0; // along with any kind of manual setting
													permanentManual=0;
													change=1;
												}
											}
								}
								
							if (temporaryManual || permanentManual) actualState=manualState; else actualState=autoState;							
							var duration = 0;
							var manov=""; 
							if (permanentManual==1) manov=" Man. override. "; else if (temporaryManual==1) manov=" Temp. override. ";
							if (node.suspend) manov+=" - SUSPENDED";
							
							if ((permanentManual==1) || (temporaryManual==1) || (node.suspend))
							{
								if (actualState==1) 
									{
										if (stopped==0)
											node.status({
												fill : "green",
												shape : "dot",
												text : "ON"+manov
											});
										else
											node.status({   // stopped completely
												fill : "black",
												shape : "dot",
												text : "STOPPED"+manov
												});	

									}
									else
									{
										if (stopped==0)
											node.status({
												fill : "red",
												shape : "dot",
												text : "OFF"+manov
											});
										else
											node.status({   // stopped completely
												fill : "black",
												shape : "dot",
												text : "STOPPED"+manov
											});	

									}
							}
							else // so not manual but auto....
								{
									outmsg2.name=node.name;
									if (goodDay==1) // auto and today's the day
									{
											if (actualState==1) 
											{  // i.e. if turning on automatically
												if (today <= actualEndTime)
													duration = actualEndTime - today;
												else
													duration = actualEndTime + (1440 - today);
												outmsg2.state="on"; outmsg2.time=pad(parseInt(duration/60),2) + "hrs " + pad(duration%60,2) + "mins"; 
												if (stopped==0)
													node.status({
														fill : "green",
														shape : "dot",
														text : "On for " + pad(parseInt(duration/60),2) + "hrs " + pad(duration%60,2) + "mins"+manov
													});	
												else
													node.status({   // stopped completely
														fill : "black",
														shape : "dot",
														text : "STOPPED"+manov
													});	
		
											} 
										else {
											if (today <= actualStartTime)
												duration = actualStartTime - today;
											else
												duration = actualStartTime + (1440 - today);
												outmsg2.state="off"; outmsg2.time=pad(parseInt(duration/60),2) + "hrs " + pad(duration%60,2) + "mins";+manov
												if (stopped==0)
													node.status({
														fill : "blue",
														shape : "dot",
														text : "Off for "  + pad(parseInt(duration/60),2) + "hrs " + pad(duration%60,2) + "mins"+manov
													});		
												else
													node.status({   // stopped completely
														fill : "black",
														shape : "dot",
														text : "STOPPED"+manov
													});	
										}
									}
								else
									{ 
									outmsg2.state="none"; outmsg2.time="";
									if (stopped==0)
										node.status({   // auto and nothing today thanks
												fill : "black",
												shape : "dot",
												text : "No action today"+manov
											});	
									else
										node.status({   // stopped completely
												fill : "black",
												shape : "dot",
												text : "STOPPED"+manov
											});	
									}
								}

							outmsg.topic = node.outtopic;
						    outmsg2.payload = (autoState==1)? "1" : "0";			
	                        outtext.payload=node.outText1;
							
							if (temporaryManual || permanentManual) outmsg.state=(actualState) ? "on" : "off" ; else outmsg.state="auto";
							outmsg.value=actualState;
							
							if (actualState==1)
								{
									outmsg.payload = node.outPayload1;
									outtext.payload=node.outText1;								
								}
							else
								{
									outmsg.payload = node.outPayload2;
									outtext.payload=node.outText2;
								}	
						
							// take into account CHANGE variable - if true a manual or auto change is due
							
							outmsg.autoState=autoState;
							outmsg.manualState=manualState;
							outmsg.timeout=timeout;
							outmsg.temporaryManual=temporaryManual;
							outmsg.permanentManual=permanentManual;
							
							outmsg2.dusk=dusk;
							outmsg2.dawn=dawn;
							outmsg2.solarNoon=solarNoon;
							outmsg2.sunrise=sunrise;
							outmsg2.sunset=sunset;
							outmsg2.night=night;
							outmsg2.nightEnd=nightEnd;
							
							if (!node.suspend)
								{
									if ((change) || ((node.atStart)&&(startDone==0)))
									{
										if (outmsg.payload>"") 
										{
											if (stopped==0) node.send([outmsg, outmsg2,outtext]);	
										}									
										 else 
										 {
											 if (stopped==0) node.send([null, outmsg2,outtext]);
										 }
									}
									else
									{
										if (outmsg.payload>"") 
										{
											if (node.repeat) 
												{ if (stopped==0) node.send([outmsg, outmsg2,null]); }
											else 
												{ if (stopped==0) node.send([null, outmsg2,null]); }
									
										}
										else
										{
											if (node.repeat) 
												{ if (stopped==0) node.send([null, outmsg2,null]); }
											else 
												{ if (stopped==0) node.send([null, outmsg2,null]); }
										}
									}	
								}
							startDone=1;
						});  // end of the internal function

		var tock = setTimeout(function() {
			node.emit("input", {});
		}, 2000); // wait 2 secs before starting to let things settle down -
					// e.g. UI connect

		var tick = setInterval(function() {
			node.emit("input", {});
		}, 60000); // trigger every 60 secs

		node.on("close", function() {
			if (tock) {
				clearTimeout(tock);
			}
			if (tick) {
				clearInterval(tick);
			}
		});

	}
	RED.nodes.registerType("bigtimer", bigTimerNode);
}
