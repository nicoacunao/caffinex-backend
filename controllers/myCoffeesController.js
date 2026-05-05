const db = require('../db');

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

// Agregar Coffee a Lista
const addMyCoffee = async (req, res) => {

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


        // Si la lista a la que se quiere agregar no es Want To Try, se verifica que en la lista a la que se quiere agregar
        // tenga un orden mayor a la actual.
        if (myList.length === 0) {

            const [historialLists] = await db.query(
                `
                SELECT mch.listId, mch.myCoffeeId
                FROM List l
                INNER JOIN ListInfo li ON l.listInfoId = li.listInfoId
                INNER JOIN MyCoffeeHistorial mch ON l.listId = mch.listId
                INNER JOIN MyCoffee mc ON mch.myCoffeeId = mc.myCoffeeId
                WHERE l.userId = ?
                AND li.listOrder < (
                    SELECT li2.listOrder
                    FROM List l2
                    INNER JOIN ListInfo li2 ON l2.listInfoId = li2.listInfoId
                    WHERE l2.listId = ?
                    LIMIT 1
                )
                AND mc.coffeeId = ?
                AND mch.dateChanged IS NULL
                ORDER BY mch.dateAdded DESC
                LIMIT 1
                `,
                [userId, listId, coffeeId]
            );

            if (historialLists.length === 0) {
                return res.status(409).json({
                    message: "El café no existe en una lista anterior válida"
                });
            }

            const oldListId = historialLists[0].listId;
            const myCoffeeId = historialLists[0].myCoffeeId;

            // Se crea el historial
            await db.query(
                `INSERT INTO MyCoffeeHistorial (myCoffeeId, listId, dateAdded, historialText)
                    VALUES (?, ?, ?, ?)`,
                [myCoffeeId, listId, dateAdded, historialText]
            );

            // y en la anterior lista se añade la fecha de cambio
            await db.query(
                `UPDATE MyCoffeeHistorial
                    SET dateChanged = ?
                    WHERE myCoffeeId = ? AND listId = ? AND dateChanged IS NULL`,
                [dateAdded, myCoffeeId, oldListId]
            );



        } else {
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

        }


        return res.status(201).json({ message: 'Café agregado a la lista' });


    } catch (error) {
        return res.status(500).json({
            message: 'Error del servidor',
            details: error.message
        });
    }

};

module.exports = { getMyCoffees, addMyCoffee }