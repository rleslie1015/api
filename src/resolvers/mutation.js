const mongoose = require('mongoose');

// for hashing user passwords
const bcrypt = require('bcrypt');
// for generating and validating tokens
const jwt = require('jsonwebtoken');

const {
    AuthenticationError,
    ForbiddenError
} = require('apollo-server-express');
require('dotenv').config()

const gravatar = require('../util/gravatar');
const { models } = require('mongoose');
const { db } = require('../models/user');

module.exports = {
    signUp: async(parent, {username, email, password}, {models}) => {
        // normalize the email address 
        email = email.trim().toLowerCase()
        //hass the password
        const hashed = await bcrypt.hash(password, 10);
        // create avatar url
        const avatar = gravatar(email);
        try {
            const user = await models.User.create({
                username,
                email,
                avatar, 
                password: hashed
            });

            // create and return json token
            return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        } catch (err) {
            console.log(err);
            throw new Error('Error creating account');
        }
    },
    signIn: async (parent, { username, email, password }, {models}) => {
        if (email) {
            // normalize email
            email = email.trim().toLowerCase();
        }
        
        const user = await models.User.findOne({
            $or: [{email}, {username}]
        });
        
        // if no user is found throw an authentication error
        if (!user) {
            throw new AuthenticationError('Error signing in');
        }

        // if passwords don't match, throw authentication error
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new AuthenticationError('Error signing in')
        }

        //create and return new json token
        return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    },
    newNote: async (parent, args, { models, user }) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to create a note.')
        }
        return await models.Note.create({
            content: args.content,
            // reference the authors mongo id
            author: mongoose.Types.ObjectId(user.id)
        });
    },
    deleteNote: async (parent, {}, { models, user }) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to delete a note.')
        }

        // find the note
        const note = await models.Note.findById(id);
        // if the note owner and current user don't match, throw a forbidden error
        if (note && String(note.author) !== user.id) {
            throw new ForbiddenError("You do not have permission to delete the note.")
        }

        try {

            await note.remove();
            return true; 
        } catch (err) {
            return false
        }
    },
    updateNote: async (parent, { id, content }, { models, user}) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to delete a note.')
        }
        const note = await models.Note.findById(id);

        // if the note owner and current user don't match, throw a forbidden error
        if (note && String(note.author) !== user.id) {
            throw new ForbiddenError("You do not have permission to delete the note.")
        }
        // update the note in the database and return the updated note
        return await models.Note.findOneAndUpdate(
            {
                _id: id
            },
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        );
    },
    toggleFavorite: async(parent, { id }, { models, user }) => {
        if(!user) {
            throw new AuthenticationError();
        }

        // check to see if the user has already favorited the note
        let noteCheck = await models.Note.findById(id);
        const hasUser = noteCheck.favoritedBy.indexOf(user.id);

        // if user exists in the list
        // pull them from the list and reduce the favorited count by one
        if (hasUser >= 0) {
            return await models.Note.findByIdAndUpdate(
                id,
                {
                    $pull: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: -1
                    }
                },
                {
                    // set new to true to return the updated doc
                    new: true
                }
            );
        } else {
            // if user doesn't exists in the list 
            // add them to list and increment the favoritedCount by 1
            return await models.Note.findByIdAndUpdate(
                id,
                {
                    $push: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: 1
                    }
                },
                {
                    new: true
                }
            );
        }
    }
}
