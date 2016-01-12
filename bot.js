var http        = require('http');
var moment      = require('moment');
var Keys        = require('./keys');
var Strs        = require('./strings');
var Parse       = require('parse').Parse;
var TelegramBot = require('node-telegram-bot-api');

// Start bot via localy
// Parse.initialize(Keys.PARSE_CLIENT_KEY, Keys.PARSE_JS_KEY);
// var bot = new TelegramBot(Keys.BOT_API_TOKEN, {polling: true});

// Start bot via openshift
Parse.initialize(Keys.PARSE_CLIENT_KEY, Keys.PARSE_JS_KEY);
var bot = new TelegramBot(Keys.BOT_API_TOKEN, {
  webHook: {port: process.env.OPENSHIFT_NODEJS_PORT, host: process.env.OPENSHIFT_NODEJS_IP}
});
bot.setWebHook(process.env.OPENSHIFT_APP_DNS+':443/bot'+Keys.BOT_API_TOKEN);

bot.on('message', function (msg) {
  var chatId  = msg.chat.id;
  var SERV_GMT_OFFSET = -18000000

  getChat(chatId).then( function (chat) {
    // Calculate offset from server and localy
    var msgDate = moment.unix(msg.date) - SERV_GMT_OFFSET + moment.unix(chat.get("gmtOffset"));

    if (msg.location) {
      if (chat.get("waitingLocation")) {
        http.get("http://api.timezonedb.com/?lat=" + msg.location.latitude +
                 "&lng=" + msg.location.longitude +
                 "&format=json&key=" + Keys.TIME_ZONE, function(res) {
          if (res.statusCode == 200) {
            res.on('data', function(chunk) {
              var data = JSON.parse(chunk.toString());
              setGmtOffset(chat, parseInt(data.gmtOffset));
              bot.sendMessage(chatId, Strs.sLctnHlp2);
            });
          }
        }).on('error', function(e) {
          console.log("Got error: " + e.message);
        });
      }
    } else if (msg.text == '/start') {
      bot.sendMessage(chatId, Strs.sStrt);
    } else if (msg.text == '/help') {
      bot.sendMessage(chatId, Strs.sHlp);
    } else if (msg.text == '/location') {
      setWaitingLocation(chat);
      bot.sendMessage(chatId, Strs.sLctnHlp1);
    } else if (msg.text == '/newyear') {
      bot.sendMessage(chatId, timeLeftNY(msgDate));
    } else if (msg.text.indexOf("/set") == 0) {
      bot.sendMessage(chatId, setTimer(chatId, msgDate));
    } else if (msg.text.indexOf("/get") == 0) {
      var arr = msg.text.split(" ");
      var param = arr[1];
      if (param === undefined) {
        bot.sendMessage(chatId, Strs.sErr2);
      } else if (moment(param, 'DD/M/YYYY').isValid()) {
        var timestamp = timeDiff(param, msgDate);
        if (timestamp < 0) {
          bot.sendMessage(chatId, Strs.sErr1);
        } else {
          bot.sendMessage(chatId, timeLeft(timestamp));
        }
      } else {
        getTimer(chatId, param).then( function (timer) {
          if (timer) {
            var timestamp = timeDiff(timer.get("date"), msgDate);
            if (timestamp < 0) {
              message = Strs.sErr1;
            } else {
              message = timeLeft(timestamp);
            }
          } else {
            message = Strs.sErr3;
          }
          bot.sendMessage(chatId, message);
        });
      }
    }
  });
});

function getChat(chatId) {
  var Chat = Parse.Object.extend("Chat");
  var query = new Parse.Query(Chat);
  query.equalTo("chatId", chatId);
  return query.first().then(function(chat) {
    if (!chat) {
      var chat = new Chat();
      return chat.save({
        chatId: chatId,
        gmtOffset: 0,
        waitingLocation: false
      });
    } else {
      return Parse.Promise.as(chat);
    }
  });
}

function setWaitingLocation(chat) {
  chat.save({
    waitingLocation: true
  });
}

function setGmtOffset(chat, gmtOffset) {
  chat.save({
    gmtOffset: gmtOffset,
    waitingLocation: false
  });
}

function setTimer(chatId, msgDate) {
  var message = "";
  var chatId = msg.chat.id;
  var arr = msg.text.split(" ");
  var name = arr[1];
  var date = arr[2];
  if (name === undefined || date === undefined) {
    message = Strs.sErr2;
  } else {
    var timestamp = timeDiff(date, msgDate)
    if (timestamp < 0) {
      message = Strs.sErr1;
    } else if (isNaN(timestamp)) {
      message = Strs.sErr4;
    } else {
      saveTimer(chatId, name.toLowerCase(), date);
      message = timeLeft(timestamp);
    }
  }
  return message;
}

function saveTimer(chatId, name, date) {
  var Timer = Parse.Object.extend("Timer");
  var query = new Parse.Query(Timer);
  query.equalTo("chatId", chatId).equalTo("name", name);
  query.find().then(function(results) {
    if (results.length > 0) {
      results[0].save({
        name: name,
        date: date
      });
    } else {
      var timer = new Timer();
      timer.save({
        chatId: chatId,
        name: name,
        date: date
      });
    }
  });
}

function getTimer(chatId, param) {
  var Timer = Parse.Object.extend("Timer");
  var query = new Parse.Query(Timer);
  query.equalTo("chatId", chatId).equalTo("name", param.toLowerCase());
  return query.first();
}

function timeLeftNY(date) {
  return timeLeft(timeDiff("01.01." + (new Date(date).getFullYear() + 1), date));
}

function timeDiff(date, startDate) {
  var endDate = moment(date, 'DD/M/YYYY');
  return endDate.diff(startDate);
}

function timeLeft(timeLeft) {
  var days    = Math.floor(timeLeft/24/60/60/1000);
  var hours   = Math.floor(timeLeft/60/60/1000 - days*24);
  var minutes = Math.floor(timeLeft/60/1000 - days*24*60 - hours*60);
  var seconds = Math.floor(timeLeft/1000 - days*24*60*60 - hours*60*60 - minutes*60);

  var text = "";
  if (days != 0) {
    text = text + days + " days, ";
  }
  if (hours != 0) {
    text = text + hours + " hours, ";
  } else if (days != 0) {
    text = text + hours + " hours, ";
  }
  if (minutes != 0) {
    if (days == 0 && hours == 0) {
      text = text + minutes + " minutes, " + seconds + " seconds";
    }
    text = text + minutes + " minutes";
  } else if (days != 0 && hours != 0) {
    text = text + minutes + " minutes";
  } else {
    text = seconds + " seconds";
  }
  return text;
}

function getDateFromMsg(msg) {
  var arr = msg.split(".").map(function (val) {
    return Number(val);
  });
  return {year: arr[2], month: arr[1], day: arr[0], hour: 0, minute: 0, second: 0};
}
