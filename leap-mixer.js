var ws;
var Theremin = {};

function init() {
  ws = new WebSocket("ws://localhost:6437/");
  
  // On successful connection
  ws.onopen = function(event) {
    if(!Theremin.context){
      Theremin.context = new webkitAudioContext();
    }
    Theremin.oscillator = Theremin.context.createOscillator();
    Theremin.gainNode = Theremin.context.createGainNode();
    Theremin.gainNode.gain.value = 0;
    Theremin.oscillator.type = 0;
    Theremin.oscillator.frequency.value = 440;
    Theremin.oscillator.connect(Theremin.gainNode);
    Theremin.gainNode.connect(Theremin.context.destination);

    Theremin.oscillator.noteOn(0);
  };
  
  var square = $('#square');
  var t = 0;

  ws.onmessage = function(event) {
    var obj = JSON.parse(event.data);

    if (obj.hands && obj.hands.length) {
      var x = obj.hands[0].palmPosition[0];
      var y = obj.hands[0].palmPosition[1];
      var z = obj.hands[0].palmPosition[2];
    
      if(Theremin.oscillator){
        if (z < 200) {
          
          x = (x + 100) * 0.01;
          y = (y - 300) * 0.008;
          setPosition(x, y);
        } else {
          unsetPosition();
        }
      }
    } else {
      unsetPosition();
    }
  };
  
  function setPosition(x, y) {
    x = Math.log(x);
    y = Math.log(y);
    
    // console.log(gain);
    x = x < 0 ? 0 : x;
    x = x > 1 ? 1 : x;
    y = y < 0 ? 0 : y;
    y = y > 1 ? 1 : y;
    if (t++ % 10 == 0) console.log({x:x,y:y});
    
    square.css({
      left: x*200,
      bottom: y*200
    });
    square.removeClass('inactive');
    
    var gain = 1-y;
    var frequency = (1-x)*1000;
    Theremin.gainNode.gain.value = gain;
    Theremin.oscillator.frequency.value = frequency;
  }
  
  function unsetPosition() {
    Theremin.gainNode.gain.value = 0;
    square.addClass('inactive');
  }
  
  // On socket close
  ws.onclose = function(event) {
    ws = null;
    Theremin.oscillator.noteOff(0);
    delete Theremin.oscillator;
    delete Theremin.gainNode;
  }
}

window.addEventListener('load', init, false);