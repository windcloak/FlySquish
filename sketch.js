let guy = []
let count = 20
let speed = 1
let score = 0
let timer = 30
let isEnd = false // did the game end
let isWin = false
const canvas_width = 800
const canvas_height = 600
const spriteX = 75
let instrument, synthJSON, phaser, lfo
const duoSynth = new Tone.DuoSynth().toDestination()
const synth = new Tone.MembraneSynth().toDestination()

let mergedData, melodyPart

const {
  getBarsBeats,
  addTimes,
  getTransportTimes,
  mergeMusicDataPart,
} = toneRhythm.toneRhythm(Tone.Time) // both `toneRhythm` and `Tone.Time` are available globally from imports above

function preload() {
  for (var i = 0; i < count; i++) {
    guy[i] = new Walker(
      'bug.png',
      random(canvas_width),
      random(canvas_height - 100),
      random([-1, 1]),
      true, // alive or not
    )
  }
}

function setup() {
  // put setup code here
  createCanvas(canvas_width, canvas_height)
  imageMode(CENTER)

  textSize(32)
  textStyle(NORMAL)
  strokeWeight(4)
  stroke(color(255, 255, 255))
  textAlign(CENTER, CENTER)

  // create synth
  instrument = new Tone.MembraneSynth();
  synthJSON = {
    pitchDecay: 0.2,
    octaves: 1.2,
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.001,
      decay: 0.8,
      sustain: 0.01,
      release: 1.4,
      attackCurve: 'exponential',
    },
  }

  instrument.set(synthJSON)

  
  phaser = new Tone.Phaser({
    baseFrequency: 250,
    octaves: 3.1,
    sensitivity: 0,
    Q: 2,
    gain: 5,
    rolloff: -24,
    follower: {
      attack: 0.3,
      release: 0.1,
    },
    wet: 0.5,
  }).toDestination()
  instrument.connect(phaser)

  // make connections
  instrument.connect(Tone.Destination)
}

function mouseClicked() {
  for (var i = 0; i < count; i++) {
    guy[i].squish(mouseX, mouseY)
  }
}

function draw() {
  background(204, 255, 255)
  text(`SCORE: ${score}`, 100, 50)
  countdown()
  text(`COUNTDOWN: ${timer}`, 160, 90)
  for (var i = 0; i < count; i++) {
    guy[i].draw()
  }
  playMusic()
}

function Walker(imageName, x, y, moving, isAlive) {
  this.spriteSheet = loadImage(imageName)
  this.frame = 0
  this.x = x
  this.y = y
  this.moving = moving
  this.facing = moving
  this.isAlive = isAlive

  this.draw = function () {
    // image(img, dx, dy, dWidth, dHeight, sx, sy, [sWidth], [sHeight])
    push()
    translate(this.x, this.y)
    if (this.facing < 0) {
      scale(-1.0, 1.0)
    }

    if (this.moving == 0 && this.isAlive) {
      image(this.spriteSheet, 0, 0, spriteX, spriteX, 0, 0, spriteX, spriteX)
    } else if (this.isAlive) {
      for (var i = 0; i < 7; i++) {
        if (this.frame == i) {
          image(
            this.spriteSheet,
            0,
            0,
            spriteX,
            spriteX,
            80 * i,
            0,
            spriteX,
            spriteX,
          )
        }
      }
    } else {
      // dead bug
      image(
        this.spriteSheet,
        0,
        0,
        spriteX,
        spriteX,
        640,
        0,
        spriteX + 5,
        spriteX,
      )
    }

    if (frameCount % 6 == 0) {
      this.frame = (this.frame + 1) % 7
      // walk across screen
      this.x = this.x + this.moving * 5 * speed
      if (this.x < 30) {
        this.moving = 1
        this.facing = 1
      }
      // if reach edge of screen
      if (this.x > width - 30) {
        this.moving = -1
        this.facing = -1
      }
    }

    pop()
  }

  this.go = function (direction) {
    this.moving = direction
    this.facing = direction
  }

  this.stop = function () {
    this.moving = 0
    this.frame = 3
  }

  // if cursor is in squish area, kill the bug
  this.squish = function (x, y) {
    if (
      this.x - 40 < x &&
      x < this.x + 40 &&
      this.y - 40 < y &&
      y < this.y + 40 &&
      !isEnd &&
      this.isAlive
    ) {
      this.moving = 0
      speed++
      score++
      this.isAlive = false
    }
  }
}

function countdown() {
  if (frameCount % 60 == 0 && timer > 0 && !isWin) {
    // if the frameCount is divisible by 60, then a second has passed. it will stop at 0
    timer--
  }
  if (timer == 0 && !isWin) {
    text('GAME OVER', width / 2, height * 0.7)
    endGame()
  }
  if (score == count) {
    text('YOU WIN', width / 2, height * 0.7)
    isWin = true
    endGame()
  }
}

function endGame() {
  isEnd = true
  speed = 0
}

function playMusic() {

  const now = Tone.now()
    const loopA = new Tone.Loop(time => {
      // instrument.triggerAttackRelease("C4", "8n", now)
      // instrument.triggerAttackRelease("E4", "8n", now + 0.5)
    instrument.triggerAttackRelease('C4', '8n')
    instrument.triggerAttackRelease('E4', '16n')
    instrument.triggerAttackRelease('G4', '16n')
    instrument.triggerAttackRelease('B4', '8n')
    instrument.triggerAttackRelease('A4', '2n') // last note plays longest
    }, "2n").start(0);

    // duoSynth.triggerAttackRelease("C4", "2n");
    instrument.sync()

    Tone.Transport.bpm.value = 80

    // instrument.triggerAttackRelease('C4', '8n', 0)
    // instrument.triggerAttackRelease('E4', '16n', '8n')
    // instrument.triggerAttackRelease('G4', '16n', '8n')
    // instrument.triggerAttackRelease('B4', '8n', '4n')
    // instrument.triggerAttackRelease('A4', '2n', '8n') // last note plays longest
    Tone.Transport.start()

    // ramp the bpm to 10 over 3 seconds
    // Tone.Transport.bpm.rampTo(10, 3);
  
}