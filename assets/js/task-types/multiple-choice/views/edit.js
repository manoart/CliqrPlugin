import Backbone from 'backbone'
import FormView from './form'

const EditView = FormView.extend({

    className: 'cliqr--multiple-choice-edit-view',

    onSubmitForm(event) {
        event.preventDefault()
        if (this.model.isValid()) {
            this.trigger('editTask', this.model)
        }
    },

    onClickCancel(event) {
        event.preventDefault()
        this.trigger('cancel', this.model)
    }
})

export default EditView
