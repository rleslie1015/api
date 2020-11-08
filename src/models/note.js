const mongoose = require('mongoose');
const { User } = require('.');

const noteSchema= new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        }, 
        author: {
            type: mongoose.Schema.Types,
            ref: User,
            required: true
        }
    },
    {
        timestamps: true
    }

);

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;