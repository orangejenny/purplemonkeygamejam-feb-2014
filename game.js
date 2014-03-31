$(document).ready(function() {
	World.initialize();
	startGame();

	// Interval to decrement health
	setInterval(function() {
		if (!$('.story').is(':visible')) {
			World.incrementHealth(World.raceIsFinished() ? -1 : -0.5);
			renderHealth();
			gameOver();
		}
	}, 3000);

	// Listener for dismissing story
	$('.story button').on('click', function() {
		if (gameOver()) {
			startGame();
		}
		else {
			$('.story').hide();
		}
	});

	// Listeners for moving & turning left/right
	$('.controls button[data-action="turn"]').on('click', function() {
		handleTurn($(this).data("direction"));
	});
	$('.controls button[data-action="move"]').on('click', function() {
		handleMove();
	});
	$(document).on('keydown', function(event) {
		switch (event.keyCode) {
			case 13:
				var $button = $('.story button');
				if ($button.is(':visible')) {
					$button.click();
				}
				break;
			case 37:
				handleTurn("left");
				break;
			case 38:
				if (!$('.controls button[data-action="move"]').is(':disabled')) {
					handleMove();
				}
				break;
			case 39:
				handleTurn("right");
				break;
		}
	});
});

function startGame() {
	World.reset();
	render();
	renderStory("It's race time!", true);
}

var orientations = {
	N: 'NORTH',
	S: 'SOUTH',
	E: 'EAST',
	W: 'WEST',
};

function render() {
	$('.rotate-right').removeClass('rotate-right');
	$('.rotate-left').removeClass('rotate-left');
	$('.squares').css('bottom', 0);

	renderHealth();
	if (gameOver()) {
		return;
	}

	// Debug info
	//console.log("location: row " + World.getRow() + ", column " + World.getColumn());
	//console.log("orientation: " + orientations[World.getOrientation()]);

	// Render squares
	_.each(World.getSquareTypes(), function(type, index) {
		var $square = $('.squares .square[data-position="' + index + '"]');
		$square.attr("data-type", type || '');
	});

	renderDirective();
	renderCompass();
	updateControls();
}

function renderStory(html, allowdismissal) {
	var $story = $('.story');
	$story.find(".text").html(html);
	$story.show();
	var $button = $story.find('button');
	if (allowdismissal) {
		$button.show();
	}
	else {
		$button.hide();
	}
}

function updateControls() {
	var $move = $('.controls button[data-action="move"]');
	if (World.canMove()) {
		$move.attr("disabled", false);
	}
	else {
		$move.attr("disabled", true);
	}
}

function gameOver() {
	if (World.getHealth() <= 0) {
		renderStory("You fell asleep.<br>In the street.<br>And got hit by a truck :(", true);
		return true;
	}
	else if (World.raceIsFinished() && World.getDistanceHome() === 0) {
		renderStory("You win.<br>Time for a nap at home.", false);
		return true;
	}
	return false;
}

function renderHealth() {
	var $container = $(".health");
	var health = Math.round(World.getHealth());
	$container.find(".text").html(health + "%");
	var color = health >= 50
		? '#5cb85c'
		: health >= 20
			? '#f0ad4e'
			: '#d9534f'
	;
	$container.find(".filling")
		.height(health + '%')
		.css("background-color", color);
}

function renderCompass() {
	var orientation = World.getOrientation();
	var letters = "NESWNES".match(new RegExp(orientation + "\\w{3}"))[0];
	_.each(letters.split(""), function(letter, index) {
		$('.compass .letter[data-position="' + index + '"]').html(letter);
	});
}

function renderDirective() {
	$('.squares .directive').hide();
	if (!World.raceIsFinished()) {
		var directive = World.getDirective();
		$('.instruction').html('');
		if (!directive) {
			$('.instruction').html("Went off course, now where's the finish line again?");
		}
		//console.log(directive ? "head " + orientations[directive] : "off the course, can't help you");
		var orientation = World.getOrientation();
		var action;
		if (directive === orientation) {
			action = "forward";
		}
		else {
			switch (orientation) {
				case 'N':
					actions = {
						'S': 'backward',
						'E': 'right',
						'W': 'left',
					};
					break;
				case 'S':
					actions = {
						'N': 'backward',
						'E': 'left',
						'W': 'right',
					};
					break;
				case 'E':
					actions = {
						'N': 'left',
						'S': 'right',
						'W': 'backward',
					};
					break;
				case 'W':
					actions = {
						'E': 'backward',
						'N': 'right',
						'S': 'left',
					};
					break;
			}
			action = actions[directive];
		}
		$('.squares .directive[data-action="' + action + '"]').show();
	}
}

function handleMove() {
	if (gameOver()) {
		return;
	}

	/*$('.avatar').addClass('running');
	$('.avatar').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
		$(this).removeClass('running');
	});*/

	var oldFinished = World.raceIsFinished();
	var oldDistance = World.getDistanceHome();

	switch (World.getOrientation()) {
		case 'N':
			World.setLocation(World.getRow() - 1, World.getColumn());
			break;
		case 'E':
			World.setLocation(World.getRow(), World.getColumn() + 1);
			break;
		case 'S':
			World.setLocation(World.getRow() + 1, World.getColumn());
			break;
		case 'W':
			World.setLocation(World.getRow(), World.getColumn() - 1);
			break;
	}

	/*if (oldFinished && Math.random() * 10 < 1) {
		World.incrementHealth(-10);
		renderStory("Hit by car!", true);
	}*/

	if (World.raceIsFinished()) {
		var distance = World.getDistanceHome();
		var direction = _.map(World.getDirectionHome().split(""), function(letter) { return orientations[letter]; }).join("");
		var instruction = distance ? "Home is " + Math.round(distance) + " moves " + direction + " ...ish." : '';
		$('.instruction').html(instruction);
		if (!oldFinished) {
			renderStory("You win...now what?<br>Get back to the start before you fall asleep.", true);
		}
	}

	// Slide squares down
	$('.squares').animate({
		bottom: '-200px',
	}, {
		complete: function() {
			render();
		},
	});
}

function handleTurn(direction) {
	if (gameOver()) {
		return;
	}

	var directions = "NESW".split("");
	var index = _.indexOf(directions, World.getOrientation());
	if (direction === "left") {
		index = (index - 1 + directions.length) % directions.length;
	}
	else {
		index = (index + 1) % directions.length;
	}
	World.setOrientation(directions[index]);


	// Rotate squares
	$('.squares').addClass("rotate-" + direction);
	setTimeout(render, 500);
}
