// A library of useful methods for dealing with time

TWM.Lib = {
  /*
  * Convert seconds to human-readable minutes
  */
  secondsToMinutes: function(secs){

    // Round the seconds to an int in case it ain't
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));
    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);
    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var hourStr = hours.toString();
    var secondStr = seconds.toString();
    var minuteStr = minutes.toString();
    var timeStr = "";
    
    // Add preceeding zeroes to seconds if necessary
    if(secondStr.length < 2) {
      secondStr = "0" + secondStr;
    }
    // Add preceeding zeroes to the minutes if necessary and the track is longer than 1 hour
    if(hours > 0 && minuteStr.length < 2) {
      minuteStr = "0" + minuteStr;
    }
    // Add hours if there are any
    if(hours > 0) {
      timeStr += hourStr + ":";
    }
    timeStr += minuteStr + ":" + secondStr;
    return timeStr;
  }
};