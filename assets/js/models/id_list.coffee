define [
  'underscore'
], (_) ->

  ###
  TODO docs
  ###
  id_list = do ->

    KEY = "cliqr.model.IDList"

    # stale after a single day
    DECAY_TIME = 60 * 60 * 24

    # stale after 15s
    #DECAY_TIME = 15

    time = ->
      Math.floor(Date.now() / 1000)

    fetch = ->
      JSON.parse(window.localStorage.getItem(KEY)) ? {}

    save = (ids) ->
      window.localStorage.setItem KEY, JSON.stringify ids
      ids

    removeStaleIDs = (old_ids) ->
      best_before = time() - DECAY_TIME
      ids = {}
      for id, timestamp of old_ids when timestamp >= best_before
        ids[id] = timestamp
      ids

    removeStaleIDs = _.compose save, removeStaleIDs, fetch
    do removeStaleIDs

    # TODO possibly deprecated
    # ids = fetch()
    # $(window).on "storage", -> ids = fetch()

    add: (id) ->
      ids = fetch()
      ids[id] = time()
      save ids
      @

    remove: (id) ->
      ids = fetch()
      delete ids[id]
      save ids
      @

    test: (id) ->
      fetch()[id]?