describe("World", function() {
  var world, rob, zoe, kim;

  beforeEach(function() {
    world = new World();
    rob = new Critter({mind: new CritterMind(Critter.Actions.MOVE_FORWARD)});
    zoe = new Critter({mind: new CritterMind(Critter.Actions.TURN_LEFT)});
    kim = new Critter({mind: new CritterMind(Critter.Actions.REPRODUCE)});
  });

  describe("#update", function(){
    beforeEach(function() {
      var robsOriginalLocation, zoesOriginalLocation, kimsOriginalLocation;
      robsOriginalLocation = {x: 1, y: 1};
      zoesOriginalLocation = {x: 4, y: 4};
      kimsOriginalLocation = {x: 7, y: 7};
      world.place(rob, robsOriginalLocation);
      world.place(zoe, zoesOriginalLocation);
      world.place(kim, kimsOriginalLocation);
    });

    it("should call getAction on all critters", function(){
      spyOn(rob, "getAction");
      spyOn(zoe, "getAction");
      spyOn(kim, "getAction");
      world.update();
      expect(rob.getAction).toHaveBeenCalled();
      expect(zoe.getAction).toHaveBeenCalled();
      expect(kim.getAction).toHaveBeenCalled();
    });

    describe("when the getAction is MOVE_FORWARD", function() {
      it("should call #moveCritterForward", function() {
        spyOn(world, 'moveCritterForward');
        world.update();
        expect(world.moveCritterForward).toHaveBeenCalledWith(rob);
      });
    });

    describe("when the getAction is TURN_LEFT", function () {
      it("should call #turnCritterLeft", function () {
        spyOn(world, 'turnCritterLeft');
        world.update();
        expect(world.turnCritterLeft).toHaveBeenCalledWith(zoe);
      });
    });

    describe("when the getAction is REPRODUCE", function () {
      it("should call #reproduceCritter", function () {
        spyOn(world, 'reproduceCritter');
        world.update();
        expect(world.reproduceCritter).toHaveBeenCalledWith(kim);
      });
    });
  });

  describe("critter actions", function(){
    var robsOriginalLocation, zoesOriginalLocation, kimsOriginalLocation;
    beforeEach(function() {
      robsOriginalLocation = {x: 1, y: 1};
      zoesOriginalLocation = {x: 4, y: 4};
      kimsOriginalLocation = {x: 7, y: 7};
      world.place(rob, robsOriginalLocation);
      world.place(zoe, zoesOriginalLocation);
      world.place(kim, kimsOriginalLocation);
    });

    describe("#moveCritterForward", function() {
      describe('when there is an empty tile in front of the critter', function() {
        beforeEach(function() {
          world.place(rob, {x: 4, y: 1});
          world.moveCritterForward(rob);
        });

        it("should remove the critter from the tile it is in", function(){
          expect(world.tiles[4][1]).not.toBe(rob);
        });

        it("should add the critter to the tile in front of the previous one", function() {
          expect(world.tiles[4][0]).toBe(rob);
          expect(rob.location).toEqual({x:4, y:0});
        })
      });

      describe("when there is another critter in front of rob", function() {
        beforeEach(function() {
          world.place(rob, {x: 4, y: 1});
          world.place(zoe, {x: 4, y: 0});
          world.moveCritterForward(rob);
        });

        it('should not move Rob', function(){
          expect(world.tiles[4][1]).toBe(rob);
          expect(rob.location).toEqual({x:4, y:1});
        });

        it('should not move Zoe', function() {
          expect(world.tiles[4][0]).toBe(zoe);
          expect(zoe.location).toEqual({x:4, y:0});
        });
      });

      describe('when there is the edge of the world in front of the critter', function() {
        beforeEach(function() {
          world.place(rob, {x: 4, y: 0});
          world.moveCritterForward(rob);
        });

        it('should not move Rob', function(){
          expect(rob.location).toEqual({x:4, y:0});
        });
      });
    });

    describe("#turnCritterLeft", function() {
      it("should update the critter's cardinal direction", function () {
        expect(zoe.direction).toBe(CardinalDirection.NORTH);
        world.turnCritterLeft(zoe);
        expect(zoe.direction).toBe(CardinalDirection.WEST);
        world.turnCritterLeft(zoe);
        expect(zoe.direction).toBe(CardinalDirection.SOUTH);
        world.turnCritterLeft(zoe);
        expect(zoe.direction).toBe(CardinalDirection.EAST);
        world.turnCritterLeft(zoe);
        expect(zoe.direction).toBe(CardinalDirection.NORTH);
      });

      it("should not move the critter", function () {
        var oldLocation = _.extend(zoesOriginalLocation);
        world.update();
        expect(world.tiles[4][4]).toBe(zoe);
        expect(zoe.location).toEqual(oldLocation);
      });

    });

    describe("#reproduceCritter", function () {
      var offspringLocation;
      beforeEach(function () {
        var kimsDirection = CardinalDirection.ALL_DIRECTIONS[
          Math.floor(Math.random() * CardinalDirection.ALL_DIRECTIONS.length)
          ];
        kim.direction = kimsDirection;
      });

      describe("left child", function() {
        beforeEach(function(){
          offspringLocation = world.getTileInDirection(RelativeDirection.LEFT, kim);
        });

        describe("when there is an open position to the left", function() {
          var offspring;

          beforeEach(function() {
            world.reproduceCritter(kim);
            offspring = world.getThingAt(offspringLocation);
          });

          it("should create a critter to the left", function(){
            expect(offspring).not.toBeFalsy();
          });

          describe("offspring", function() {
            it("should have its parent's mind", function(){
              expect(offspring.mind).toEqual(kim.mind);
            });

            it("should be oriented to the left of its parent", function(){
              expect(offspring.direction).toEqual(
                CardinalDirection.getDirectionAfterRotation(kim.direction, RelativeDirection.LEFT)
              );
            });
          });
        });

        describe("when there is a critter to the left", function() {
          var robsLocation;

          beforeEach(function() {
            robsLocation = world.getTileInDirection(RelativeDirection.LEFT, kim);
            world.place(rob, robsLocation);
            world.reproduceCritter(kim);
          });

          it("should not create a critter to the left", function() {
            expect(world.getThingAt(robsLocation)).toEqual(rob);
          });
        });

        describe("when the edge of the world is to the left", function () {
          var placeSpy;
          beforeEach(function() {
            kim.direction = CardinalDirection.NORTH;
            world.place(kim, {x: 0, y: 4});
            placeSpy = spyOn(world, "place");
          });

          it("should not place a critter to the left", function () {
            world.reproduceCritter(kim);
            expect(placeSpy.calls.count()).toEqual(1);
          });
        });
      });

      describe("right child", function(){
        beforeEach(function () {
          offspringLocation = world.getTileInDirection(RelativeDirection.RIGHT, kim);
        });

        describe("when there is an open position to the right", function() {
          var offspring;

          beforeEach(function() {
            world.reproduceCritter(kim);
            offspring = world.getThingAt(offspringLocation);
          });

          it("should create a critter to the right", function(){
            expect(offspring).not.toBeFalsy();
          });

          describe("offspring", function() {
            it("should have its parent's mind", function(){
              expect(offspring.mind).toEqual(kim.mind);
            });

            it("should be oriented to the right of its parent", function(){
              expect(offspring.direction).toEqual(
                CardinalDirection.getDirectionAfterRotation(kim.direction, RelativeDirection.RIGHT)
              );
            });
          });
        });

        describe("when there is a critter to the right", function() {
          var robsLocation;

          beforeEach(function() {
            robsLocation = world.getTileInDirection(RelativeDirection.RIGHT, kim);
            world.place(rob, robsLocation);
            world.reproduceCritter(kim);
          });

          it("should not create a critter to the right", function() {
            expect(world.getThingAt(robsLocation)).toEqual(rob);
          });
        });

        describe("when the edge of the world is to the right", function () {
          var placeSpy;
          beforeEach(function() {
            kim.direction = CardinalDirection.WEST;
            world.place(kim, {x: 4, y: 0});
            placeSpy = spyOn(world, "place");
          });

          it("should not place a critter to the left", function () {
            world.reproduceCritter(kim);
            expect(placeSpy.calls.count()).toEqual(1);
          });
        });
      });
    });
  });

  describe("#place", function() {
    var location;

    describe('in a tile within the world', function() {
      beforeEach(function() {
        location = {
          x: Math.floor(Math.random() * 5),
          y: Math.floor(Math.random() * 5)
        }

        spyOn(console, "error").and.callThrough();
        world.place(rob, location);
      });

      it('should put Rob in a tile', function() {
        expect(world.tiles[location.x][location.y]).toBe(rob);
      });

      it('should default direction to north', function() {
        expect(rob.direction).toEqual(CardinalDirection.NORTH);
      });

      it("should set rob's location", function() {
        expect(rob.location).toEqual(location);
      });

      it('should not log an error', function() {
        expect(console.error).not.toHaveBeenCalled();
      });

      it('should add rob to worldly things', function() {
        var allMyRobs = _.filter(world.things, function(thing) { return thing === rob; });
        expect(allMyRobs.length).toEqual(1);
      });

      it('if rob is already placed, it should not add two robs to worldly things', function() {
        var anotherLocation = {x: 2, y: 2};
        world.place(rob, anotherLocation);
        var allMyRobs = _.filter(world.things, function(thing) { return thing == rob; });
        expect(allMyRobs.length).toEqual(1);
      });
    });

    describe('in a tile outside the world', function() {
      var outsideTheWorld = {x: -1, y: -1};

      describe('and thing already has prior location', function() {
        var robsOldLocation;

        beforeEach(function() {
          robsOldLocation = {x: 1, y: 1};
          world.place(rob, robsOldLocation);
          world.place(rob, outsideTheWorld);
        });

        it("do nothing", function() {
          expect(world.tiles[robsOldLocation.x][robsOldLocation.y]).toEqual(rob);
          expect(world.tiles[outsideTheWorld.x]).toBeFalsy();
          expect(rob.location).toEqual(robsOldLocation);
        });
      });

      describe('and thing is being added to the world', function() {
        it("should throw an error", function() {
          function thisShouldThrow() {
            world.place(rob, outsideTheWorld);
          }
          expect(thisShouldThrow).toThrow();
        });

        it('should not add rob to worldly things', function() {
          try {
            world.place(rob, outsideTheWorld);
          }
          catch(e) {
            // ignore
          }
          finally {
            expect(world.things).not.toContain(rob);
          }
        });
      });
    });
  });

  describe("#remove", function() {
    beforeEach(function() {
      world.things.push(rob);
      world.remove(rob);
    });

    it("should remove the thing from the tile", function() {
      expect(world.things).not.toContain(rob);
    });
  });

  describe("#isLocationInsideWorld", function() {
    var x, y;

    describe("for an y within the world bounds", function() {
      beforeEach(function() {
        y = Math.floor(Math.random() * 8);
      });

      it("should return false for an x less than zero", function() {
        expect(world.isLocationInsideWorld({x: -1, y: y})).toBeFalsy();
      });

      it("should return true for an x within the world bounds", function() {
        expect(world.isLocationInsideWorld({x: Math.floor(Math.random() * 8), y: y})).toBeTruthy();
      });

      it("should return false for an x greater than width", function() {
        expect(world.isLocationInsideWorld({x: world.width, y: y})).toBeFalsy();
      });
    });

    describe("for an x within the world bounds", function() {
      beforeEach(function() {
        x = Math.floor(Math.random() * 8);
      });

      it("should return false for a y less than zero", function() {
        expect(world.isLocationInsideWorld({x: x, y: -1})).toBeFalsy();
      });

      it("should return true for a y within the world bounds", function() {
        expect(world.isLocationInsideWorld({x: x, y: Math.floor(Math.random() * 8)})).toBeTruthy();
      });

      it("should return true for a y greater than height", function() {
        expect(world.isLocationInsideWorld({x: x, y: world.height})).toBeFalsy();
      });
    });

  });

  describe("#getTileInDirection", function() {
    var relativeDirection;
    
    beforeEach(function() {
      rob.location = {x: 1, y:1};
    });

    describe("RelativeDirection.FORWARD", function () {
      beforeEach(function() {
        relativeDirection = RelativeDirection.FORWARD;  
      });
      
      it("should return coordinates for the tile to the WEST of Rob when Rob is facing WEST", function() {
        rob.direction = CardinalDirection.WEST;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x:0, y: 1});
      });

      it("should return coordinates for the tile to the EAST of Rob when Rob is facing EAST", function() {
        rob.direction = CardinalDirection.EAST;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 2, y: 1});
      });

      it("should return coordinates for the tile to the NORTH of Rob when Rob is facing NORTH", function() {
        rob.direction = CardinalDirection.NORTH;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 1, y: 0});
      });

      it("should return coordinates for the tile to the SOUTH of Rob when Rob is facing SOUTH", function() {
        rob.direction = CardinalDirection.SOUTH;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 1, y: 2});
      });  
    });

    describe("RelativeDirection.LEFT", function () {
      beforeEach(function() {
        relativeDirection = RelativeDirection.LEFT;
      })
      
      it("should return coordinates for the tile to the SOUTH of Rob when Rob is facing WEST", function() {
        rob.direction = CardinalDirection.WEST;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x:1, y: 2});
      });

      it("should return coordinates for the tile to the NORTH of Rob when Rob is facing ESAT", function() {
        rob.direction = CardinalDirection.EAST;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 1, y: 0});
      });

      it("should return coordinates for the tile to the WEST of Rob when Rob is facing NORTH", function() {
        rob.direction = CardinalDirection.NORTH;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 0, y: 1});
      });

      it("should return coordinates for the tile to the EAST of Rob when Rob is facing SOUTH", function() {
        rob.direction = CardinalDirection.SOUTH;
        expect(world.getTileInDirection(relativeDirection, rob)).toEqual({x: 2, y: 1});
      });
    });
  });
});
