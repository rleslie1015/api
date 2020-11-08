module.exports = {
    // Resolve the author info for a note when requested
    author: async (note, args, { models }) => {
        return await models.User.findById(note.author);
    },
    // resolve the favoritedBy inf for a note when requested
    favoritedBy: async(note, args, { models }) => {
        return await models.User.find({ _id: { $in: note.favoritedBy } })
    }
}