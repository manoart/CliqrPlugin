import Backbone from 'backbone'
import _ from 'underscore'

const TaskGroupsCreateView = Backbone.View.extend({

    tagName: 'article',

    className: 'cliqr--task-groups-create',

    events: {
        'click .js-cancel': 'onClickCancel'
    },

    initialize(options) {
        console.log("initializing")
    },

    remove() {
        Backbone.View.prototype.remove.call(this)
        console.log("removing")
    },

    render() {
        const template = require('../../hbs/task-groups-create.hbs')
        this.$el.html(template(this.collection.toJSON()))
        return this
    },

    onClickCancel(event) {
        event.preventDefault()
        this.trigger('cancel', event, this)
    }
})

export default TaskGroupsCreateView
