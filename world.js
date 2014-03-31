World = (function() {
	return {
		map: [
			">>>V....     ....   ..    .       .                     .             ",
			"   V   .       >>>>>>>>>>>>>>V    .                     .             ",
			"   V   .       ^             V.....                     ..............",
			"   >>>>>>*>>>>>^             V                          .             ",
			"   .            ...         V<                          .             ",
			"   .            . .     .   V                           .             ",
			"   .            . .......   V........................   .             ",
			"   .            . .     .   V                       .   .             ",
			"   .            ...     V<<<<                       .   .             ",
			"   .                    V                           .   .             ",
			"   .      ...           V                           .   .             ",
			"   .     ..             V                           .   .             ",
			"..........      ...V<<<<<.....................>>>>>>>>>>>>>>>>V.......",
			"   .               V                          ^         .     V       ",
			"   .               V                          ^         .     V       ",
			"   ................V                          ^         .     V       ",
			"   .               V                          ^         .     V       ",
			"   .               V                          ^         .     V       ",
			"...................>>>>>>>>>>>>>>>>>>>>>>>>>>>^         .     >>V     ",
			"   .                      .                   .         .       V     ",
			"   .                      .                   .         .       V     ",
			"   .                      .                   ...........       V     ",
			"   .                      .                                     V     ",
			"   .                      .............                      V<<<     ",
			"   .                      .                                  V        ",
			"   .                      .                                  >>>>>>>>*",
		],

		directives: {
			'>': 'E',
			'<': 'W',
			'^': 'N',
			'V': 'S',
		},

		home: [0, 0],

		// Basic accessors
		getRow: function() { return this.location[0]; },
		getColumn: function() { return this.location[1]; },
		getHealth: function() { return Math.max(this.health, 0); },
		getOrientation: function() { return this.orientation; },
		raceIsFinished: function() { return this.finished; },

		setLocation: function(row, column) {
			this.location[0] = row;
			this.location[1] = column;
			if (!this.finished && this.map[this.getRow()][this.getColumn()] === "*") {
				this.finished = true;
			}
			this.health -= this._healthCostMove();
		},

		setOrientation: function(orientation) {
			this.orientation = orientation;
			this.health -= this._healthCostTurn();
		},

		incrementHealth: function(health) {
			this.health += health;
		},

		getDirective: function() {
			return this.directives[this.map[this.getRow()][this.getColumn()]];
		},

		getDistanceHome: function() {
			return Math.sqrt(Math.pow(this._homeRowDiff(), 2) + Math.pow(this._homeColumnDiff(), 2));
		},

		getDirectionHome: function() {
			var direction = "";
			var rowdiff = this._homeRowDiff();	// current - home
			var coldiff = this._homeColumnDiff();	// current - home

			if (rowdiff / (rowdiff + coldiff) > 1/3) {
				direction += rowdiff > 0 ? 'N' : 'S';
			}
			if (coldiff / (rowdiff + coldiff) > 1/3) {
				direction += coldiff > 0 ? 'W' : 'E';
			}

			return direction;
		},

		getSquareTypes: function() {
			var symbols = new Array(6);
			var r = this.getRow();
			var c = this.getColumn();
			// 0 1 2
			// 3 4 5
			// 6 7 8
			// 9 0 1
			// (relative to compass)
			var symbols = [
				r == 1 && c == 1 ? 'S' : r > 0 ? this.map[r - 1][c - 1] : undefined,
				r == 1 && c == 0 ? 'S' : r > 0 ? this.map[r - 1][c] : undefined,
				r > 0 ? this.map[r - 1][c + 1] : undefined,
				r == 0 && c == 1 ? 'S' : this.map[r][c - 1],
				r == 0 && c == 0 ? 'S' : this.map[r][c],
				this.map[r][c + 1],
				this.map[r + 1][c - 1],
				this.map[r + 1][c],
				this.map[r + 1][c + 1],
			];

			// 0 1 2
			// 3 4 5
			// 6 7 8
			// (relative to user (at 7) orientation)
			var squares;
			switch (this.getOrientation()) {
				case 'N':
					squares = "012345";
					break;
				case 'E':
					squares = "258147";
					break;
				case 'S':
					squares = "876543";
					break;
				case 'W':
					squares = "630741";
					break;
			}

			return _.map(squares.split(""), function(square) {
				if (symbols[square]) {
					if (symbols[square] === 'S') {
						return "start";
					}
					if (symbols[square] === '*') {
						return "finish";
					}
					return symbols[square].trim() ? "pavement" : "grass";
				}
			});
		},

		_homeRowDiff: function() { return Math.abs(this.getRow() - this.home[0]); },
		_homeColumnDiff: function() { return Math.abs(this.getColumn() - this.home[1]); },

		initialize: function() {
			this.map = _.map(this.map, function(row) {
				return row.split("");
			});
		},

		reset: function() {
			this.orientation = 'E';
			this.finished = false;
			this.health = 100;
			this.location = _.clone(this.home);
		},

		canMove: function() {
			var world = this;
			var next;
			switch (world.orientation) {
				case 'N':
					if (world.getRow() === 0) {
						break;
					}
					next = world.map[world.getRow() - 1][world.getColumn()];
					break;
				case 'S':
					if (world.getRow() >= world.map.length) {
						break;
					}
					next = world.map[world.getRow() + 1][world.getColumn()];
					break;
				case 'E':
					next = world.map[world.getRow()][world.getColumn() + 1];
					break;
				case 'W':
					next = world.map[world.getRow()][world.getColumn() - 1];
					break;
			}
			return next && next !== " ";
		},

		_healthCostMove: function() {
			if (this.raceIsFinished()) {
				return 100 / this.health * this._healthCostBase();
			}
			return this._healthCostBase();
		},

		_healthCostTurn: function() {
			return this._healthCostMove() / 3;
		},

		_healthCostBase: function() {
			var routelength = _.flatten(this.map).join("").replace(/[\s.]/g, "").length;
			return (100 / routelength) * 2
		},
	}
}());
