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
    sendGenericMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  if(messageText == 'Hi'){
    var messageData = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'hello'
      }
    };
    callSendAPI(messageData);

    var messageData1 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'What can I do for you ?'
      }
    };
    callSendAPI(messageData1);
  }else if (messageText == 'I need help with a maths problem'){
    var messageData = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'Pleased to help you !!'
      }
    };
    callSendAPI(messageData); 

    var messageData1 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'Can you send me a snapshot of your problem ?'
      }
    };
    callSendAPI(messageData1);       
  }else if(messageText == 'View Explanation'){
    var messageData = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'For Quadration equations, 1> Calculate the discriminant, b^2 - 4ac'
      }
    };
    callSendAPI(messageData); 

    var messageData1 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: '2> If the discriminant is equal to 0, there is one real root: -b / 2a'
      }
    };
    callSendAPI(messageData1);     

    var messageData2 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: '3> If the discriminant is greater than 0, there are two real roots: (-b - √discriminant) / 2a, (-b + √discriminant) / 2a'
      }
    };
    callSendAPI(messageData2);    

  }else if(messageText == 'Watch Video Lecture'){
    var messageData = {
      recipient: {
      id: recipientId
      },
     message: {
      type : 'video',
      payload: {
        url: 'https://www.youtube.com/watch?v=IWigvJcCAJ0'
      }
      }
    };
    callSendAPI(messageData); 

  }else if(messageText == 'Try Another Problem'){
    var messageData1 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'Can you send me a snapshot of your problem ?'
      }
    };
    callSendAPI(messageData1); 

  }else{
    console.log('messageText ',messageText);
    var messageData1 = {
      recipient: {
      id: recipientId
      },
     message: {
      text: 'What can I do for you ?'
      }
    };
    callSendAPI(messageData1);
  }
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
            title: "Answer",
            subtitle: "Solution is 17/25",
            buttons: [{
              type: "postback",
              title: "View Explanation",
              payload: "View Explanation",
            }, {
              type: "postback",
              title: "Watch Video Lecture",
              payload: "Watch Video Lecture",
            },{
              type: "postback",
              title: "Try Another Problem",
              payload: "Try Another Problem",
            }],
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
  sendTextMessage(senderID, payload);
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
      var tempText = textAnnotation.replaceAll(' ','');
      console.log('tempText ',tempText);
      var lhs = tempText.split('=')[0];
      console.log('lhs ',lhs);
      var rhs = tempText.split('=')[1];
      console.log('rhs ',rhs);  
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