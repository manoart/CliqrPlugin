import Backbone from 'backbone'
import _ from 'underscore'
import Promise from 'bluebird'
import { Schema, arrayOf, normalize, unionOf, valuesOf } from 'normalizr'

import { userRole, activateNavigation, showLoading, hideLoading, changeToPage } from '../utils'

import Task from '../models/task'
import TaskGroup from '../models/task_group'
import TaskGroupsCollection from '../models/task_groups'
import TasksCollection from '../models/tasks'
import Voting from '../models/voting'
import VotingsCollection from '../models/votings'

import ArchiveView from '../views/archive'
import ErrorView from '../views/error'
import TaskGroupsIndexView from '../views/task_groups_index'
import TaskGroupsShowView from '../views/task_groups_show'
import TasksEditView from '../views/tasks_edit'
import TasksShowView from '../views/tasks_show'
import VotingsCompareView from '../views/votings_compare'
import VotingsShowView from '../views/votings_show'

// instantiate then remove bootstrapped
const bootstrapTaskGroups = function () {
    const taskGroups = new TaskGroupsCollection(window.cliqr.bootstrap.taskGroups)
    delete(window.cliqr.bootstrap.taskGroups)
    return taskGroups
}

// instantiate then remove bootstrapped
const bootstrapTasks = function () {
    const taskGroups = bootstrapTaskGroups()
    const tasks = _.flatten(_.filter(taskGroups.pluck('tasks')))
    return new TasksCollection(tasks)
}

const bootstrapLastVotings = function () {
    const lastVotings = new VotingsCollection(window.cliqr.bootstrap.lastVotings || [])
    delete(window.cliqr.bootstrap.lastVotings)
    return lastVotings
}

const fetchTaskGroups = function () {
    if (window.cliqr.bootstrap.taskGroups) {
        return Promise.resolve(bootstrapTaskGroups())
    }

    const taskGroups = new TaskGroupsCollection()
    return taskGroups.fetch()
        .then((...args) => taskGroups)
}

const fetchTaskGroup = function (id) {
    let taskGroup
    if (window.cliqr.bootstrap.taskGroups) {
        taskGroup = bootstrapTaskGroups().get(id)
        if (taskGroup) {
            return Promise.resolve(taskGroup)
        }
    }

    taskGroup = new TaskGroup({ id })
    return taskGroup.fetch()
        .then( () => taskGroup )
}

const fetchVoting = function (id) {
    const voting = new Voting({ id })
    return voting.fetch()
        .then( () => voting )
}

const fetchTwoVotings = function (ids) {
    return Promise.resolve(
        _.times(2, (i) => _.tap(new Voting({ id: ids[i] }), (v) => v.fetch()) )
    )
}

const fetchTask = function (id) {
    let task
    if (window.cliqr.bootstrap.taskGroups) {
        task = bootstrapTasks().get(id)
        if (task) {
            return Promise.resolve(task)
        }
    }

    task = new Task({ id })
    return task.fetch().then( () => task )
}

const fetchLastVotings = function () {
    if (window.cliqr.bootstrap.lastVotings) {
        return Promise.resolve(bootstrapLastVotings())
    }

    const lastVotings = new VotingsCollection()
    return lastVotings.fetch()
        .then((...args) => lastVotings)
}

const StudipRouter = Backbone.Router.extend({

    routes: {
        '': 'redirectByAuthorization',

        'task-groups': 'taskGroups',
        'task-groups-:id': 'taskGroup',

        'task/show/:id': 'task',
        'task/edit/:id': 'taskEdit',

        'compare/:v1/:v2': 'votingCompare',

        'voting/:id': 'voting',

        'archive': 'archive'

    },

    routeHandler(fetcher, id, view, useCollection = 'model', ...rest) {
        showLoading()
        return fetcher(id)
            .then((response) => {
                hideLoading()
                activateNavigation(...rest)
                return changeToPage(new view({ [useCollection]: response }), this.selector)
            })
            .catch((error) => {
                const status = error && error.status
                if (status === 403) {
                    hideLoading()
                    return this.navigate('', { trigger: true, replace: true })
                }
                throw error
            })
    },

    initialize(options) {
        this.selector = options.selector

        if (window.cliqr.bootstrap.taskGroups) {

            const taskGroupSchema = new Schema('task_group')
            const testSchema = new Schema('test')
            const taskSchema = new Schema('task')
            const votingSchema = new Schema('voting')
            taskSchema.define({
                votings: arrayOf(votingSchema)
            })
            testSchema.define({
                tasks: arrayOf(taskSchema)
            })
            taskGroupSchema.define({
                test: testSchema
            });
            const response = normalize(window.cliqr.bootstrap.taskGroups, arrayOf(taskGroupSchema));
            console.log("normalizred", response)
        }
    },

    // ROUTE: ''
    redirectByAuthorization() {

        if (userRole('student')) {
            this.navigate('#archive', { trigger: true, replace: true })
        }

        else {
            this.navigate('#task-groups', { trigger: true, replace: true })
        }
    },

    // ROUTE: '#task-groups'
    taskGroups() {
        this.routeHandler(fetchTaskGroups, null, TaskGroupsIndexView, 'collection')
            .catch((...args) => {
                console.log("caught:", args)
            })
    },

    // ROUTE: '#task-groups-:id'
    taskGroup(id) { this.routeHandler(fetchTaskGroup, id, TaskGroupsShowView) },

    // ROUTE: '#task/show/:id'
    task(id) { this.routeHandler(fetchTask, id, TasksShowView) },

    // ROUTE: '#task/edit/:id'
    taskEdit(id) { this.routeHandler(fetchTask, id, TasksEditView) },

    // ROUTE: '#voting/:id'
    voting(id) { this.routeHandler(fetchVoting, id, VotingsShowView) },

    // ROUTE: '#compare/:v1/:v2'
    votingCompare(v1, v2) { this.routeHandler(fetchTwoVotings, [v1, v2], VotingsCompareView, 'votings') },

    // ROUTE: '#archive'
    archive() { this.routeHandler(fetchLastVotings, null, ArchiveView, 'collection', '#nav_cliqr_archive') }
})

export default StudipRouter