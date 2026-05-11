const db = require('../db');

const getFriendsUser = async (req, res) => {

    const {userId} = req.query;

    if (!userId) {
        return res.status(400).json({message: 'Falta el id del usuario'});
    }

    const [friends] = await db.query(
        `SELECT
            CASE
                WHEN u1.userId = ? THEN u2.userId
                ELSE u1.userId
            END AS friendId,
            CASE
                WHEN u1.userId = ? THEN u2.userName
                ELSE u1.userName
            END AS friendName
        FROM Friendship f
        INNER JOIN User u1 ON f.user1Id = u1.userId
        INNER JOIN User u2 ON f.user2Id = u2.userId
        WHERE u1.userId = ? OR u2.userId = ?`,
        [userId, userId, userId, userId]
    );

    if (friends.length == 0) {
        return res.status(404).json({message: 'No se encontraron amigos para este usuario'});
    }

    return res.status(200).json({friends});

};

module.exports = {
    getFriendsUser
};