// one page easier tetris autoplay
// shawel negussie 2015

///  helper files
Array.prototype.sum = function(prop) {
  var sum = 0;
  for (var i = 0; i < this.length; i++) {
    if (prop !== undefined) {
      sum = sum + this[i][prop];
    } else {
      sum = sum + +this[i];
    }
  }
  return sum;
}

Array.prototype.printBoard = function() {

  for (var i = 0; i < this.length; i++) {
    console.log(this[i]);
  }

  console.log('end');
}

Array.prototype.copyMatrix = function() {
  var arr = [];
  for (var i = 0; i < this.length; i++) {
    arr.push(this[i].slice(0))
  }

  return arr;
}

// svg global
var width = 450;
var height = 450;
var cellSize = 35;
var board;
var svg;
var cellGrp;
var cellrw;
var previewBoard;
var isGameOver = false;

var colors = ['#d8b365', '#d8b365', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', '#d8b365', '#543005', '#543A05', '#543005'];

var l = '1,1,1,1'
var L = '10,10,11'
var B = '11,11';
var Z = '110,011';
var N = '10,11,01';
var T = '010,111';
var score = 0;


var currentState = {};
var occupied = 1;
var empty = 4;
var arr = makeBoard(7, 12, 4);

initBoard();
scoreGame(0);
gameStatus("")
displayBoard(arr);


function shapeMatrix(shape, currentVal, replacementVal) {
  var matrix = [];
  var length = [];
  var split = shape.split(',');
  for (var i = 0; i < split.length; i++) {
    var str = split[i];
    matrix[i] = new Array();
    for (var j = 0; j < str.length; j++) {
      matrix[i][j] = parseInt(str.charAt(j));
      if (currentVal !== undefined && matrix[i][j] == currentVal) {
        if (replacementVal !== undefined) {
          matrix[i][j] = replacementVal;
        }
      }
    }
  }
  return matrix;
}

function transpose(shape, rotation) {
  rotation = rotation || 0;

  var _shape = shape;
  for (var k = 0; k < rotation; k++) {
    var split = _shape.split(',');
    var newshape = '';
    for (var i = split[0].length - 1; i > -1; i--) {
      for (var j = 0; j < split.length; j++) {
        newshape = newshape + split[j].charAt(i);
      }
      newshape += ','
    }
    _shape = newshape.substr(0, newshape.length - 1);
  }

  return _shape;
}


function makeBoard(C, R, init) {
  var matrix = [];
  for (var i = 0; i < R; i++) {
    matrix[i] = new Array();
    for (var j = 0; j < C; j++) {
      matrix[i][j] = init;
    }
  }

  return matrix;
}

function cutLine(board, val, length, empty) {
  out('cutline', board, val, length, empty)
  var horizontal = 0;
  var linescut = 0;
  for (var i = 0; i < board.length; i++) {
    horizontal = 0;
    var cj = 0;
    for (var j = 0; j < board[i].length; j++) {
      horizontal = (board[i][j] == val) ? horizontal + 1 : 0;
      if (horizontal == 0) {
        cj = j;
      }
    }

    if (horizontal == length) {
      for (var k = cj; k < board[i].length; k++) {
        board[i][k] = empty;
      }

      linescut++;
    }
  }
  return linescut;
}

function checkShapePlacement(board, shape, left, bottom, occupied, empty) {

  // this does a screen  of shape structure for one position
  // off screen position is a game over position check if by end there stil shape height left
  // get the maximum placement
  var horizontal = 0;
  var trueLeft = left - Math.floor(shape[0].length / 2);
  // check offset some lines cannot be placed offscreen 
  if (trueLeft < 0 || bottom < shape.length - 1 || trueLeft + shape[0].length > board[0].length) {
    console.log('offset problem');
    return false;
  }

  for (var i = 0; i < shape.length; i++) {
    horizontal = 0

    for (var j = 0; j < shape[i].length; j++) {
      if (board[bottom - i][j + trueLeft] != occupied || shape[shape.length - i - 1][j] !== occupied) {
        //valid passed line one  
        horizontal = horizontal + 1;
      } else {
        horizontal = 0;
      }
    }
    if (horizontal !== shape[i].length) {
      return false
    }
    // keep the minimum position that it is allowed to be    
  }
  return true;
}



function place(board, shape, left, bottom) {
  out(board, shape, left, bottom);
  var trueLeft = left - Math.floor(shape[0].length / 2);
  for (var i = 0; i < shape.length; i++) {
    for (var k = 0; k < shape[i].length; k++) {
      if (shape[shape.length - 1 - i][k] != 0) {
        board[bottom - i][trueLeft + k] = shape[shape.length - 1 - i][k];
      }
    }
  }
}

// cut = -1 , occupied = 1, empty = 4
function collapse(board, cut, occupied, empty) {
  for (var k = 0; k < board.length; k++) {
    for (var i = 0; i < board.length; i++) {
      for (var j = 0; j < board[i].length; j++) {
        if (i > 0 && board[i][j] == cut) {
          // keep the same value if the slot is empty
          board[i][j] = (board[i][j] == empty) ? board[i][j] : board[i - 1][j];
          board[i - 1][j] = cut;
        }
      }
    }
  }
  // cleanup
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[i].length; j++) {
      if (board[i][j] == cut) {
        board[i][j] = empty;
      }
    }
  }
}

function randomShape() {
  var _shape = [l, L, B, Z, N, T];
  var choice = Math.round(Math.random() * 5);
  currentState.shapeMatrix = shapeMatrix(_shape[choice]);
  currentState.shapeSerial = _shape[choice];
  return currentState.shapeMatrix;
}


function startPlay(board, left, nextShape) {

  var mShape = nextShape;
  var bottom = mShape.length - 1;

  console.log(bottom);
  var placement = checkShapePlacement(arr, mShape, left, bottom, occupied, empty);
  if (placement) {
    place(board, mShape, left, bottom);
    currentState.left = left;
    currentState.bottom = bottom;
    currentState.shape = currentState.shapeSerial;
    currentState.rotation = 0;

  }

  return placement;
}

function changePosition(board, horizontal) {
  console.log(currentState);
  var bottom = currentState.bottom;
  var left = currentState.left;

  if (board.length - 1 > bottom || horizontal != undefined) {
    // blank out current shape
    var bmShape = shapeMatrix(transpose(currentState.shape, currentState.rotation || 0), 1, 4);
    place(board, bmShape, left, bottom);

    if (horizontal !== undefined) {
      left = left + horizontal;
    } else {
      bottom++;
    }

    var mShape = shapeMatrix(transpose(currentState.shape, currentState.rotation || 0));
    var placement = checkShapePlacement(board, mShape,
      left, bottom, occupied, empty);
    // out('placement', placement);
    if (placement) {
      currentState.bottom = bottom;
      currentState.left = left;
      place(board, mShape, left, bottom);
      return true;
    } else {
      place(board, mShape, currentState.left, currentState.bottom);
    }
  }

  if (horizontal !== undefined) {
    return true;
  }

  return false;
}

function rotateShape(board) {
  var left = currentState.left;
  var bottom = currentState.bottom;
  var newRotationPos = (currentState.rotation + 1) % 4;
  var currentShape = shapeMatrix(transpose(currentState.shape, currentState.rotation));
  var newRotatedShape = shapeMatrix(transpose(currentState.shape, newRotationPos));
  var bmShape = shapeMatrix(transpose(currentState.shape, currentState.rotation), 1, 4);

  place(board, bmShape, left, bottom);

  var placement = checkShapePlacement(board, newRotatedShape,
    currentState.left, bottom, occupied, empty);
  if (placement) {
    place(board, newRotatedShape, left, bottom);
    currentState.rotation = newRotationPos;
  } else {
    place(board, currentShape, left, bottom);
  }
  board.printBoard();
}

// UI
function initBoard() {
  board = d3.select('#matrix')
    .style('width', width + 'px')
    .style('height', height + 'px');

  svg = board.append('svg')
    .attr('id', 'sMatrix')
    .attr('width', width)
    .attr('height', height)
    .append('g').attr('transform', 'translate(0,0)');
  console.log(svg);

  previewBoard = d3.select('svg').append('g').attr('id', 'preview');
}

function preview(board, arr) {
  var _arr = arr.slice(0);

  d3.select('#preview').html('');
  var pgrp = previewBoard.selectAll('g').data(_arr).enter().append('g');
  var col = pgrp.selectAll('rect').data(function(d, i) {
    return d
  }).enter();

  var cell = col.append('rect')
    .attr('width', cellSize / 3)
    .attr('height', cellSize / 3)
    .attr('x', function(d, j, i) {
      return board[0].length * cellSize + (cellSize / 3) * j + j * 1 + 10;
    })
    .attr('y', function(d, j, i) {
      return cellSize + (cellSize / 3) * i + i * 1;
    })
    .attr('fill', function(d, i, j) {
      var rand = Math.round(Math.random() * 10);
      out('SHAP VAL', d)
      if (d == 0) return '#fff'
      return colors[d];
    });


}

function displayBoard(arr) {

  cellGrp = svg.selectAll('g').data(arr).enter().append('g');

  var cellrw = cellGrp.selectAll('g')
    .data(function(d, i) {
      return d;
    }).enter().append('g');

  cellrw.append('rect')
    .attr('i', function(d, i, j) {
      return j;
    })
    .attr('j', function(d, i, j) {
      return i;
    })
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', function(d, i, j) {

      return cellSize * i + 1 * i;
    }).attr('y', function(d, i, j) {
      return cellSize * j + 1 * j;
    }).attr('fill', function(d, i, j) {
      var rand = Math.round(Math.random() * 10);
      if (d == 1) {
        return colors[(rand % 2 + 9)];
      }
      return colors[arr.length - d];
    }).on('click', function(d) {
      d3.select(this).attr('fill', function() {
        return colors[1];
      });


    })

  cellrw.append('text').text(function(d, i, j) {
      return '(' + j + ',' + i + ')';
    }).attr('x', function(d, i, j) {

      return cellSize * i + cellSize - 35;
    }).attr('y', function(d, i, j) {
      return cellSize * j + cellSize - 2;
    }).attr('font-size', '1px')
    .attr('fill', '#ddd');;

}

function updateBoard(arr) {
  console.log('update board')
  cellGrp = cellGrp.data(arr);

  var cellrw = cellGrp.selectAll('g')
    .data(function(d, i) {
      return d;
    });

  var rects = cellrw.select('rect')
    .attr('i', function(d, i, j) {
      return j;
    })
    .attr('j', function(d, i, j) {
      return i;
    })
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', function(d, i, j) {

      return cellSize * i + 1 * i;
    }).attr('y', function(d, i, j) {
      return cellSize * j + 1 * j;
    }).attr('fill', function(d, i, j) {
      console.log(d);
      var rand = Math.round(Math.random() * 10);
      if (d == 1) {
        return colors[(rand % 1 + 9)];
      }
      return colors[arr.length - d];
    });

  cellrw.selectAll('text').text(function(d, i, j) {
      return '(' + j + ',' + i + ')';
    }).attr('x', function(d, i, j) {
      return cellSize * i + cellSize - 35;
    }).attr('y', function(d, i, j) {
      return cellSize * j + cellSize - 2;
    }).attr('font-size', '1px')
    .attr('fill', '#ddd');;

}

//utility
function out(func) {
  //if ((LOG || 0) ) {
  console.log(arguments);
  // }
}


d3.select(window).on("keyup", function(d) {
  var cut = 2;
  var occupied = 1;
  var empty = 4;
  var newPiece = false;
  var key = d3.event.keyIdentifier || d3.event.key;

  if (key == 'Down' || key == 'ArrowDown') {
    newPiece = !changePosition(arr);
  }

  if (key == 'U+0020' || key == ' ') {
    rotateShape(arr)
  }
  if (key == 'Right' || key == 'ArrowRight') {
    changePosition(arr, 1);
  }
  if (key == 'Left' || key == 'ArrowLeft') {
    changePosition(arr, -1);
  }

  if (newPiece) {
    var _cutline = cutLine(arr, occupied, arr[0].length, cut)
    collapse(arr, cut, occupied, empty);
    arr.printBoard();
    startPlay(arr, 3, currentState.shapeMatrix);
    preview(arr, randomShape())
    scoreGame(_cutline);
  }
  if (isGameOver) {
    gameStatus('GAME OVER')

  } else {
    updateBoard(arr);
  }

  console.log("keypress: ", d3.event.key); // also tried "keyup", "keydown", "key"
});

var timeOutId;

function autoPlay() {

  timeOutId = setTimeout(function() {
    var cut = 2;
    var occupied = 1;
    var empty = 4;
    var newPiece = false;
    newPiece = !changePosition(arr);


    if (newPiece) {
      var _cutline = cutLine(arr, occupied, arr[0].length, cut)
      collapse(arr, cut, occupied, empty);
      arr.printBoard();
      //collapse(arr, cut, occupied, empty);
      isGameOver = !startPlay(arr, 3, currentState.shapeMatrix);

      preview(arr, randomShape())

      scoreGame(_cutline);
    }
    if (isGameOver) {
      gameStatus('GAME OVER')

    } else {
      autoPlay()
    }

  }, 1000);

  updateBoard(arr);
}

function scoreGame(_score) {
  if (_score) {
    score = score + Math.pow(2, _score);
  }

  d3.select('#score').text(score);
}

function gameStatus(status) {
  d3.select('#status').text(status);
}

d3.select('#new').on('click', function(e) {
  isGameOver = false;
  randomShape();
  clearTimeout(timeOutId);
  score = 0;
  gameStatus("")
  arr = makeBoard(7, 12, 4);
  autoPlay();
});