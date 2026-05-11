const db = require('../db');

// Obtener cafés de una lista o el historial de un café específico
const getMyCoffees = async (req, res) => {
    const { listId, myCoffeeId } = req.query;

    let query = '';
    let params = [];
    let errorMessage = '';

    try {
        if (listId) {
            query = `
                SELECT 
                    c.name,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', mch.myCoffeeHistorialId,
                            'date', mch.dateAdded,
                            'historialText', mch.historialText
                        )
                        ORDER BY mch.dateAdded DESC
                    ) AS historial
                FROM MyCoffeeHistorial mch 
                INNER JOIN MyCoffee mc ON mch.myCoffeeId = mc.myCoffeeId
                INNER JOIN Coffee c ON mc.coffeeId = c.coffeeId
                WHERE mc.myCoffeeId = ?
                GROUP BY c.name
            `;

            params = [listId];
            errorMessage = 'Error al obtener los cafés de la lista';
        } else if (myCoffeeId) {
            query = `
                SELECT 
                    c.name,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', mch.myCoffeeHistorialId,
                            'date', mch.dateAdded,
                            'historialText', mch.historialText
                        )
                    ) AS historial
                FROM MyCoffeeHistorial mch 
                INNER JOIN MyCoffee mc ON mch.myCoffeeId = mc.myCoffeeId
                INNER JOIN Coffee c ON mc.coffeeId = c.coffeeId
                WHERE mc.myCoffeeId = ?
                GROUP BY c.name
            `;

            params = [myCoffeeId];
            errorMessage = 'Error al obtener el historial del café';
        } else {
            return res.status(400).json({
                message: 'Debes enviar listId o myCoffeeId'
            });
        }

        const [results] = await db.query(query, params);
        return res.json(results);

    } catch (error) {
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }
};

// Agregar Coffee a Primera Lista
const addMyCoffeeToFirstList = async (req, res) => {

    const { userId, coffeeId, listId, dateAdded, historialText } = req.body;

    try {

        if (!userId || !coffeeId || !listId || !dateAdded) {
            return res.status(400).json({
                message: 'Faltan datos obligatorios'
            });
        }

        // Revisar si existe en la lista
        const [myCoffees] = await db.query(
            `SELECT mch.myCoffeeId AS myCoffeeId
                FROM MyCoffeeHistorial mch
                INNER JOIN MyCoffee mc ON mch.myCoffeeId = mc.myCoffeeId
                WHERE mch.listId = ? AND mc.coffeeId = ? AND mch.dateChanged IS NULL` ,
            [listId, coffeeId]
        );


        // Si existe en la lista
        if (myCoffees.length === 1) {
            return res.status(409).json({ message: 'El café ya existe en la lista' });
        }


        // En caso contrario, se revisa que si es que la lista a la que se quiere agregar es
        // Want To Try
        const [myList] = await db.query(
            `SELECT l.listId
                FROM List l
                INNER JOIN ListInfo li ON l.listInfoId = li.listInfoId
                WHERE l.listId = ? AND li.listOrder = 1`,
            [listId]
        );

        // Si no es la lista Want To Try, se retorna un error porque solo se pueden agregar cafés directamente a esa lista
        if (myList.length === 0) {
            return res.status(400).json({ message: 'Solo se pueden agregar cafés directamente a la lista Want To Try' });
        }
        // En caso contrario, se inserta el registro en My Coffee y se crea el historial (se agrega en la lista Want To Try).

        const [result] = await db.query(
            `INSERT INTO MyCoffee (coffeeId)
                    VALUES (?)`,
            [coffeeId]
        );

        const myCoffeeId = result.insertId;

        await db.query(
            `INSERT INTO MyCoffeeHistorial (myCoffeeId, listId, dateAdded, historialText)
                    VALUES (?, ?, ?, ?)`,
            [myCoffeeId, listId, dateAdded, historialText]
        );




        return res.status(201).json({ message: 'Café agregado a la lista' });


    } catch (error) {
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }

};

const changeMyCoffeeList = async (req, res) => {

    const { myCoffeeId, newListId, dateAdded, historialText } = req.body;

    try {

        if (!myCoffeeId || !newListId || !dateAdded) {
            return res.status(400).json({
                message: 'Faltan datos obligatorios'
            });
        }

        // Revisar si existe en la lista
        const [myCoffees] = await db.query(
            `SELECT mch.myCoffeeId AS myCoffeeId
                FROM MyCoffeeHistorial mch
                INNER JOIN MyCoffee mc ON mch.myCoffeeId = mc.myCoffeeId
                WHERE mch.listId = ? AND mc.myCoffeeId = ? AND mch.dateChanged IS NULL` ,
            [newListId, myCoffeeId]
        );

        // Si existe en la lista
        if (myCoffees.length === 1) {
            return res.status(409).json({ message: 'El café ya existe en la lista' });
        }

        // Se obtiene el historial del café para obtener la lista actual
        const [historialLists] = await db.query(
            `
            SELECT mch.listId
            FROM MyCoffeeHistorial mch
            WHERE mch.myCoffeeId = ? AND mch.dateChanged IS NULL
            ORDER BY mch.dateAdded DESC
            LIMIT 1
            `,
            [myCoffeeId]
        );

        if (historialLists.length === 0) {
            return res.status(404).json({
                message: "No se encontró el café en ninguna lista"
            });
        }

        const oldListId = historialLists[0].listId;

        // Se crea el nuevo historial con la nueva lista
        await db.query(
            `INSERT INTO MyCoffeeHistorial (myCoffeeId, listId, dateAdded, historialText)
                VALUES (?, ?, ?, ?)`,
            [myCoffeeId, newListId, dateAdded, historialText]
        );

        // y en la anterior lista se añade la fecha de cambio
        await db.query(
            `UPDATE MyCoffeeHistorial
                SET dateChanged = ?
                WHERE myCoffeeId = ? AND listId = ? AND dateChanged IS NULL`,
            [dateAdded, myCoffeeId, oldListId]
        );

        return res.status(200).json({ message: 'Café movido a la nueva lista' });

    } catch (error) {
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }

};


const addReviewMyCoffee = async (req, res) => {

    const { myCoffeeId, rating, reviewText, imageUrl } = req.body;

    if (!myCoffeeId || !rating) {
        return res.status(400).json({
            message: 'Faltan datos obligatorios'
        });
    }

    try {

        // Se revisa que el café esté en la lista Tried para poder reseñarlo. Para esto, se revisa el historial del café y se verifica que en alguna de las entradas del historial la lista sea la de Tried (listOrder = 3). Si no está en esa lista, no se puede reseñar.
        const [myCoffee] = await db.query(
            `SELECT myCoffeeId
                FROM MyCoffee
                INNER JOIN MyCoffeeHistorial mch ON MyCoffee.myCoffeeId = mch.myCoffeeId
                INNER JOIN List l ON mch.listId = l.listId
                INNER JOIN ListInfo li ON l.listInfoId = li.listInfoId
                WHERE MyCoffee.myCoffeeId = ? AND li.listOrder = 3`,
            [myCoffeeId]
        );

        if (myCoffee.length === 0) {
            return res.status(400).json({ message: 'Solo se pueden reseñar cafés que estén en la lista Tried' });
        }

        // Si el café está en la lista Tried, se actualiza el registro de MyCoffee con la reseña y la calificación
        await db.query(
            `UPDATE MyCoffee
                SET rating = ?, reviewText = ?, imageUrl = ?
                WHERE myCoffeeId = ?`,
            [rating, reviewText, imageUrl, myCoffeeId]
        );

        return res.status(200).json({ message: 'Café reseñado correctamente' });


    } catch (error) {
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }

};

module.exports = { getMyCoffees, addMyCoffeeToFirstList, changeMyCoffeeList, addReviewMyCoffee };