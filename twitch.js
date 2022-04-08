const tmi = require('tmi.js');
const mqtt = require('mqtt');

// User Configuration
const mqtt_host = 'MQTT_BROKER_IP';
const mqtt_port = 'MQTT_BROKER_PORT'; //default is 1883
const mqtt_username = 'MQTT_USERNAME';
const mqtt_password = 'MQTT_PASSWORD';
const mqtt_topic = '/twitch/'; //root of the MQTT topic where messages are published
const twitch_channel = 'TWITCH_CHANNEL';
const twitch_password = 'TWITCH_KEY'; //starting with "oauth:"
const twitch_botname = 'TWITCH_BOTNAME';

// MQTT Connection
const connectUrl = `mqtt://${mqtt_host}:${mqtt_port}`;
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const clientMqtt = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: mqtt_username,
  password: mqtt_password,
  reconnectPeriod: 1000,
});

// Twitch chat connection
const opts = {
  identity: {
    username: twitch_botname,
    password: twitch_password
  },
  channels: [
    twitch_channel
  ]
};

// Create a client with our options
const clientTwitch = new tmi.client(opts);

// RegExp
const hexColor = new RegExp("^#[a-fA-F0-9]{6}$");

// Register our event handlers (defined below)
clientTwitch.on('message', onMessageHandler);
clientTwitch.on('connected', onConnectedHandler);
clientMqtt.on('connect', onPublish);

// Connect to Twitch:
clientTwitch.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message and ignore case
  const commandName = msg.trim().toLowerCase();
  const topicName = mqtt_topic + commandName.substring(1, 5);
  const color = selectColor(commandName.substring(6));
  let interval = false;
  // Exemple of an MQTT message that change the color of 3 different LEDs by typing "!led[number] [color]" in the chat
    if(color){
      switch(commandName.substring(1, 5)){
        case "led1":
        case "led2":
        case "led3":
          onPublish(topicName,color);
          console.log(`* Executed ${commandName} command`);
          break;
        case "leds":
          onPublish(mqtt_topic + "led1",color);
          onPublish(mqtt_topic + "led2",color);
          onPublish(mqtt_topic + "led3",color);
          console.log(`* Executed ${commandName} command`);
          break;
        case "run":
          if(!interval){
            interval = setInterval(()=>{
              onPublish(mqtt_topic + "led1",randColor());
              onPublish(mqtt_topic + "led2",randColor());
              onPublish(mqtt_topic + "led3",randColor());
            },10000);
          }
          
          break;
        case "stop":
          clearInterval(interval);
          interval = false;
          break;
      }
    }
    
}

// MQTT publish
function onPublish (tpc, msg) {
  clientMqtt.publish(tpc, msg);
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function selectColor(color){
  switch (color) {
    case 'rouge':
    case 'red':
      return'#FF0000';
    case 'vert':
    case 'green':
      return'#00FF00';
    case 'bleu':
    case 'blue':
      return'#0000FF';
    case 'cyan':
      return'#00FFFF';
    case 'magenta':
    case 'fushia':
      return'#FF00FF';
    case 'jaune':
    case 'yellow':
      return'#FFDD00';
    case 'orange':
      return'#FF6600';
    case 'turquoise':
    case 'teal':
      return'#00FF88';
    case 'rose':
    case 'pink':
      return'#FF44FF';
    case 'violet':
      return'#8000FF';
    case 'blanc':
    case 'white':
      return'#FFFFFF';
    case 'noir':
    case 'black':
    case 'off':
      return'#000000';
    case "random":
    case "rand":
      return randColor();
    default:
      if (hexColor.test(color) === true) {return color;}
      else{ return false;}
  }
}
function randColor(){
  return "#"+Math.floor(Math.random()*16777215).toString(16);
}