$(function() {
  World = Backbone.Model.extend({
    initialize: function(options) {
      this.width = 10;
      this.height = 10;
      this.tiles = [];
      this.things = [];
      this.stimulusPackager = options && options.stimulusPackager ? options.stimulusPackager : new StimulusPackager();
    },

    update: function(){
      var world = this;
      var deadThings = [];
      _.each(_.shuffle(this.things), function(thing){
        if (thing.getActions) {
          var stimuli = world.stimulusPackager.package(world, thing);
          var actions = thing.getActions(stimuli);
          actions = _.isArray(actions) ? actions : [actions];

          _.each(actions, function(action) {
            switch(action) {
              case Critter.Actions.MOVE_FORWARD:
                world.moveCritterForward(thing);
                break;

              case Critter.Actions.TURN_LEFT:
                world.turnCritterLeft(thing);
                break;

              case Critter.Actions.TURN_RIGHT:
                world.turnCritterRight(thing);
                break;

              case Critter.Actions.REPRODUCE:
                world.reproduceCritter(thing);
                break;

              case Critter.Actions.INCREMENT_COUNTER:
                world.incrementCounterOnCritter(thing);
                break;

              case Critter.Actions.DECREMENT_COUNTER:
                world.decrementCounterOnCritter(thing);
                break;
            }

            if(thing.mana <= 0){
              deadThings.push(thing);
            }
          });
        }
      });

      _.each(deadThings, function(thing){ world.remove(thing);});
    },

    place: function(thing, location){
      var x = location.x;
      var y = location.y;

      if(!this.isLocationInsideWorld(location)) {
        if(!thing.location){
          throw new Error("Placing thing outside the world at " + x + "," + y, thing);
        }
      }
      else {
        var row = this.tiles[x] || [];
        if(row[y]){
          this.remove(row[y]);
        }

        if(thing.location){
          this.tiles[thing.location.x][thing.location.y] = null;
        }

        row[y] = thing;
        this.tiles[x] = row;
        thing.location = {x:x, y:y};
        if (!this.contains(thing)) {
          this.things.push(thing);
        }
      }
    },

    contains: function(thing) {
      return _.contains(this.things, thing);
    },

    remove: function(thing){
      var index = this.things.indexOf(thing);
      if (index >= 0) {
        this.things.splice(index, 1);
      }
      if (thing.location && this.tiles[thing.location.x]) {
        this.tiles[thing.location.x][thing.location.y] = undefined;
      }

      delete thing.location;
    },

    isLocationInsideWorld: function(location){
      return location.x >= 0 && location.x < this.width &&
             location.y >= 0 && location.y < this.height;
    },

    getThingAt: function(location){
      return this.tiles[location.x] ? this.tiles[location.x][location.y] : null;
    },

    getTileInDirection: function(direction, thing){
      function getOffsetInFrontOf(thingDirection){
        var xDelta = 0, yDelta = 0;
        switch (thingDirection){
          case CardinalDirection.WEST:
            xDelta = -1;
            break;
          case CardinalDirection.NORTH:
            yDelta = -1;
            break;
          case CardinalDirection.EAST:
            xDelta = 1;
            break;
          case CardinalDirection.SOUTH:
            yDelta = 1;
            break;
        }
        return {xDelta: xDelta, yDelta: yDelta};
      }

      var offset;
      if (direction == RelativeDirection.FORWARD){
        offset = getOffsetInFrontOf(thing.direction);
      }
      else {
        var cardinalDirectionAfterRotation = CardinalDirection.getDirectionAfterRotation(thing.direction, direction);
        offset = getOffsetInFrontOf(cardinalDirectionAfterRotation);
      }

      return {x: thing.location.x + offset.xDelta, y: thing.location.y + offset.yDelta};
    },

    moveCritterForward: function(critter){
      var nextLocation = this.getTileInDirection(RelativeDirection.FORWARD, critter);
      var thingAtNextLocation = this.getThingAt(nextLocation);
      if (!thingAtNextLocation || critter.canEat(thingAtNextLocation)) {
        this.place(critter, nextLocation);
        critter.eat(thingAtNextLocation);
      }
      
      critter.mana -= Critter.Actions.MOVE_FORWARD.cost;
    },

    turnCritter: function(critter, direction, action) {
      critter.direction = CardinalDirection.getDirectionAfterRotation(
        critter.direction,
        direction
      );

      critter.mana -= action.cost;
    },

    turnCritterLeft: function(critter){
      return this.turnCritter(critter, RelativeDirection.LEFT, Critter.Actions.TURN_LEFT);
    },

    turnCritterRight: function(critter){
      return this.turnCritter(critter, RelativeDirection.RIGHT, Critter.Actions.TURN_RIGHT);
    },

    reproduceCritter: function(critter){
      var world = this;
      function createOffspringInDirection(relativeDirection){
        var offspringLocation = world.getTileInDirection(relativeDirection, critter);
        var contentsOfTile = world.getThingAt(offspringLocation);
        var offspring = new Critter({mind: critter.mind});
        if ((!contentsOfTile || offspring.canEat(contentsOfTile)) && world.isLocationInsideWorld(offspringLocation)) {
          offspring.direction = CardinalDirection.getDirectionAfterRotation(critter.direction, relativeDirection);
          world.place(offspring, offspringLocation);
          offspring.eat(contentsOfTile);
        }
      }

      if(critter.mana >= Critter.Actions.REPRODUCE.cost){
        if (Math.floor(Math.random() * 1000) % 2) {
          createOffspringInDirection(RelativeDirection.LEFT);
          createOffspringInDirection(RelativeDirection.RIGHT);
        }
        else {
          createOffspringInDirection(RelativeDirection.RIGHT);
          createOffspringInDirection(RelativeDirection.LEFT);
        }
      }
      
      critter.mana -= Critter.Actions.REPRODUCE.cost;
    },

    incrementCounterOnCritter: function(critter) {
      critter.vitals.counter++;
    },

    decrementCounterOnCritter: function(critter) {
      critter.vitals.counter--;
    }
  });
});
