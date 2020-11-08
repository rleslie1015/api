module.exports = {
    // resolve the list of notes when a user is requested
    notes: async (user, args, { models }) => {
        return await models.Note.find({ author: user._id }).sort({ _id: -1 });
    },
    //resolve the list of favorites when a user is requested
    favorites: async(user, args, { models }) => {
        return await models.Note.find({ favoritedBy: user._id }).sort({ _id: -1});
    }
}