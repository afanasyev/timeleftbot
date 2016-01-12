var Strs = {};
Strs.sDate = "1. /get [date] - /get 21.12.2012\n";
Strs.sSet  = "2. /set [name] [date] and I will remember this date for you (name should not contain spaces), " +
                  "i.e. /set DoomsDay21.12.2012\n";
Strs.sGet  = "3. /get [name] — /get DoomsDay\n";
Strs.sNwr  = "4. /newyear — time to newyear.\n";
Strs.sLctn = "5. /location - set your location for calculate correct time left."
Strs.sAds  = "Mobile apps and bot development — http://appgranula.com";
Strs.sAll  = Strs.sDate + Strs.sSet + Strs.sGet + Strs.sNwr + Strs.sLctn + "\n" + Strs.sAds;

Strs.sStrt = "Hi, I know how to track how much time left. Enter: \n\n" + Strs.sAll;
Strs.sHlp  = "Enter to track how much time left:\n\n" + Strs.sAll;

Strs.sErr1 = "Error. Date is earlier than current moment";
Strs.sErr2 = "Incorrect command. Valid example: /get DoomsDay or /get 21.12.2012";
Strs.sErr3 = "Error. No saved date or date is incorrect. Valid command example: /get DoomsDay или /get 21.12.2012";
Strs.sErr4 = "Error. Date is incorrect. Valid date example: 21.12.2012";

Strs.sLctnHlp1 = "Send your location (Attach location)";
Strs.sLctnHlp2 = "Your location is found!";

module.exports = Strs;
