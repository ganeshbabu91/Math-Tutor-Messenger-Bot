const
	express = require('express');
	bodyParser = require('body-parser')
  	request = require('request');
	app = express();
	port = process.env.PORT || 5000;
	PAGE_ACCESS_TOKEN = "EAANYlFHm1dcBAGTy8ABwnPTa2ZBzm85elaLkEwI2YWgAf7gZBBVLcDWIUqbsnMJpNETIQUCJ72JUwf8BDqrhrZAH8ihbd3Ws3uDuqZB1Eehf0l5lJJ49qUB0RfVhIDw10Ns2ehSCeeTx8JtW6tjgKUG1Yk2Df9AZC63OIE2M7ygZDZD",
	VALIDATION_TOKEN = "verify-tbd";

var algebra = require('algebra.js');

var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

var vision = require('node-cloud-vision-api')
vision.init({auth: 'AIzaSyCbDDuE_7XnbPTfJtMhgWWETzQTcnpKRlY'});


app.use(bodyParser.json());
	
app.listen(port, function() {
  console.log('Node app is running on port', port);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/webhook', function (req, res) {
  var data = req.body;
  //console.log("request from messenger = %o",req);
  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
         // receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  console.log('messageText ',messageText);
  console.log('messageAttachments ',messageAttachments);
  if(messageAttachments){
    messageAttachments.forEach(function(item, index){
      callGoogleAPI(item.payload.url);
      console.log('item.payload.url ',item.payload.url);
    });
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function callGoogleAPI(imageUrl){
  //console.log('inside callGoogleAPI');
  // 2nd image of request is load from Web
  var req = new vision.Request({
    image: new vision.Image({
      url: imageUrl
    }),
    features: [
      new vision.Feature('TEXT_DETECTION', 10),
    ]
  })

  // send single request
  vision.annotate(req).then((res) => {
    // handling response
    console.log(JSON.stringify(res.responses))
    var resultObject = res.responses[0];
    if(resultObject.textAnnotations){
      var textAnnotation = resultObject.textAnnotations[0].description;
      var tempText = textAnnotation.replace(' ','');
      console.log('tempText ',tempText);
      if(tempText.indexOf('=')>-1){
        var lhs = tempText.split('=')[0];
        console.log('lhs ',lhs);
        var rhs = tempText.split('=')[1];
        console.log('rhs ',rhs);
      }
      var lhsExpr = algebra.parse(lhs);
      var rhsExpr = algebra.parse(rhs);
      var eq = new Equation(lhsExpr, rhsExpr);
      console.log('lhsExpr ',lhsExpr);
      console.log('rhsExpr ',rhsExpr);
      console.log('eq ',eq);
      console.log('eq.solveFor("x") ',eq.solveFor("x"));
    }
  }, (e) => {
    console.log('Error: ', e)
  })
}