$(function() {
  Critter = Backbone.Model.extend({
    initialize: function(options) {
      this.direction = CardinalDirection.NORTH;
      this.mind = (options && options.mind) ? options.mind : CritterMind.EmptyMind;
      this.mana = (options && options.mana) ? options.mana : Critter.DEFAULT_STARTING_MANA;
    },

    getAction : function() {
      return this.mind.getAction();
    }
  });

  Critter.Actions = {
    MOVE_FORWARD: {
      key: 'move_forward',
      cost: 1
    },
    TURN_LEFT: {
      key: 'turn left',
      cost: 1
    },
    REPRODUCE: {
      key: 'reproduce',
      cost: 10
    },
    STARE_OFF_INTO_SPACE: {
      key: 'noop',
      cost: 0
    }
  };

  Critter.DEFAULT_STARTING_MANA = 10;
});
