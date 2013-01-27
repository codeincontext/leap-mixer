var ws;
var audioContext;
var Mixer = {}

var track1;
var track2;

var loadedTrackCount = 0;

function playAllTracks() {
  track1.play();
  track2.play();
  track3.play();
}

var Track = (function() {

  function Track(file, fill, gain, loopAfter) {
    this.name = file;
    this.fill = fill;
    this.defaultGain = gain;
    this.loopAfter = loopAfter;
    var that = this;
        
    var request = new XMLHttpRequest();
    request.open("GET", file, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
          that.buffer = buffer;
          
          if (++loadedTrackCount == 3) {
            playAllTracks();
          }
        }, function() {
          return alert('Unsupported file format');
        });
    };
    request.send();
  
  };
  
  Track.prototype.play = function() {
    if (!this.buffer) {
      alert.log('This track isn\'t ready yet. Should probably make sure we\'re all loaded first');
      return;
    };
    
    this.source = audioContext.createBufferSource();
    this.gainNode = audioContext.createGainNode();
    // this.source.loop = true;
    
    if (this.loopAfter) {
      var that = this
      setTimeout(function() {
        that.source.noteOff(0);
        that.defaultGain = that.gainNode.gain.value;
        that.play();
      }, this.loopAfter);
    }

    this.source.buffer = this.buffer;  
    this.source.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);
    this.setGain(this.defaultGain);
    this.source.noteOn(0);
    console.log('playing');
  };
  
  Track.prototype.setGain = function(gain) {
    this.fill.css('height', gain*220);
    
    if (!this.gainNode) return;
    this.gainNode.gain.value = gain;
  }

  return Track;
})();


function init() {
  ws = new WebSocket("ws://localhost:6437/");
  
  // On successful connection
  ws.onopen = function(event) {
    if(!audioContext){
      audioContext = new webkitAudioContext();
    }
    
    var restart = 45000
    // track1 = new Track('02 I Think I Like It (original mix).mp3', $('#level1 .fill'));
    // track2 = new Track('Like A G6 (Chew Fu So Twisted Fix).mp3', $('#level2 .fill'));
    track1 = new Track('zedd/Bass + Synths (NO SIDECHAIN).wav', $('#level1 .fill'), 0, restart);
    // track2 = new Track('zedd/Counter-Melodies.wav', $('#level2 .fill'), 0.5);
    track2 = new Track('zedd/Vocals.wav', $('#level2 .fill'), 1, restart);
    track3 = new Track('zedd/Vox FX Chord Cuts.wav', $('#level3 .fill'), 0, restart);
  };
  
  var square = $('#square');
  var level1 = $('#level1');
  var level2 = $('#level2');
  var level3 = $('#level3');
  var levels = $('.level')
  var t = 0;

  ws.onmessage = function(event) {
    var obj = JSON.parse(event.data);
    
    levels.removeClass('hover');

    if (obj.hands && obj.hands.length) {      
      var i = obj.hands.length;
      while (hand = obj.hands[--i]) {
        if (hand.palmPosition[2] > 50) continue;
        
        var inRange = (hand.palmPosition[1] < 295 && hand.palmPosition[1] > 230);
        console.log(inRange);
        // console.log(hand.palmPosition[1]);
        
        var gain = getGainFromY(hand.palmPosition[1]);
        if (hand.palmPosition[0] < -45) {
          level1.addClass('hover');
          if (inRange) track1.setGain(gain);
        } else if (hand.palmPosition[0] > 45) {
          level3.addClass('hover');
          if (inRange) track3.setGain(gain);
        } else {
          level2.addClass('hover');
          if (inRange) track2.setGain(gain);
        }
      }
      
      function getGainFromY(y) {
        gain = (y - 200) * 0.03;
        gain = Math.log(gain);
        gain = gain < 0 ? 0 : gain;
        gain = gain > 1 ? 1 : gain;
        // console.log({y:y, gain: gain});
        return 1-gain;
      }
    } else {
    }
  };

  // On socket close
  ws.onclose = function(event) {
    ws = null;
    Mixer.oscillator.noteOff(0);
    delete Mixer.oscillator;
    delete Mixer.gainNode;
  }
}

window.addEventListener('load', init, false);