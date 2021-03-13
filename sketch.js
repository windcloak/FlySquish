let guy = []
let count = 20
let speed = 1
let score = 0
let timer = 30
let isStart = true
let isEnd = false // did the game end
let isWin = false
const canvas_width = 800
const canvas_height = 600
const spriteX = 75

let synth, intro_score, sequence_intro, sequence_gameover, player
var startPart
var chord

Tone.Transport.bpm.value = 10
const noiseSynth = new Tone.MembraneSynth().toDestination()

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
  player = new Tone.Player("game_over.wav").toDestination();
  player.loop = false;
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

  synth = make_poly().instrument
  // the more items in the array the shorter their
  // duration
  var score = [
    [
      ['A4', 'B4'],
      ['C4', 'C4', 'D4'],
    ],
    ['G4', 'A4', 'b4', ['e4', 'e4', 'e4', 'e4']],
  ]
  intro_score = ['c3', [['d3', 'e3'], 'g3'], ['d4', 'd4']] // intro
  gameover_score = ['f#2', [['eb2',  'eb2'], ['d2', 'd2']],'c2'] // gameover
  // array of notes, subdivision
  sequence = new Tone.Sequence(
    (time, note) => {
      synth.triggerAttackRelease(note, '8n', time)
    },
    score,
    2,
  )

  sequence_intro = new Tone.Sequence(
    (time, note) => {
      synth.triggerAttackRelease(note, '8n', time)
    },
    intro_score,
    2,
  )

  // Game over
  sequence_gameover = new Tone.Sequence(
    (time, note) => {
      synth.triggerAttackRelease(note, '8n', time)
    },
    gameover_score,
    0,
  )

  Tone.Transport.start()
}

function mouseClicked() {
  for (var i = 0; i < count; i++) {
    guy[i].squish(mouseX, mouseY)
  }
}

function draw() {
  background(204, 255, 255)
  if (!isStart) {
    text(`SCORE: ${score}`, 100, 50)
    countdown()
    text(`COUNTDOWN: ${timer}`, 160, 90)
    for (var i = 0; i < count; i++) {
      guy[i].draw()
    }

    playMusic()
  } else if (isStart && !isEnd) {
    text(`Press Spacebar to start Bug Squish Game`,  canvas_width/2, canvas_height/2)
    playIntroMusic()
  } 
  else if (isEnd && !isWin) {
    text(`You lose! You didn't kill all the bugs! Your Score:  ${score}`,  canvas_width/2, canvas_height/2)
    playGameoverMusic()
  }
}

function keyPressed() {
  if (keyCode == 32) {
    // space
    isStart = false
    sequence_intro.stop()
  }
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
      // gameover bug
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
      noiseSynth.triggerAttackRelease('D5', '16n') // squished bug
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
    playGameoverMusic()
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
  // increase bpm as game continues
  if (frameCount % 60 == 0 && !isEnd) {
    Tone.Transport.bpm.value++
  }
  if (!isStart && !isEnd)
    sequence.start()
  else
    sequence.stop()
}

function playIntroMusic() {
  if (isStart) sequence_intro.start()
}

function playGameoverMusic() {
  sequence.stop()
  if (isEnd && !isWin) {
    player.start();
  }
    // sequence_gameover.start()
}

function make_poly() {
  // create synth
  var instrument = new Tone.FMSynth()
  var synthJSON = {
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

  var effect1, effect2, effect3

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

  // define deep dispose function
  function deep_dispose() {
    if (instrument != undefined && instrument != null) {
      instrument.dispose()
      instrument = null
    }
  }

  return {
    instrument: instrument,
    deep_dispose: deep_dispose,
  }
}
