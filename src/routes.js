import Joi from "joi";
import { db, GAMES, CUSTOMERS, RENTALS } from "./database.js";
import dayjs from "dayjs";

export const getGames = async (req, res) => {
  try {
    const games = await db.query(GAMES);
    return res.send(games.rows);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
export const postGame = async (req, res) => {
  const JoiObject = Joi.object({
    name: Joi.string().required(),
    image: Joi.string(),
    stockTotal: Joi.number().required().min(1),
    pricePerDay: Joi.number().required().min(1),
  });
  const validadation = JoiObject.validate(req.body);
  try {
    if (validadation.error) return res.sendStatus(400);
    const exist = await db.query(GAMES + ` where name = '${req.body?.name}'`);
    if (exist.rows.length > 0) return res.sendStatus(409);
    await db.query('INSERT INTO games ("name", "image", "stockTotal", "pricePerDay") VALUES ($1, $2, $3, $4)',
    [req.body?.name, req.body?.image, req.body?.stockTotal, req.body?.pricePerDay]);
    return res.sendStatus(201);
  } catch (error) {
    console.log("erro");
    res.status(500).send(error.message);
  }
};

export const getCustomers = async (req, res) => {
  if (req.params?.id) {
    try {
      const id = await db.query(CUSTOMERS + `where id = ${req.params?.id}`);

      if (id.rows.length === 0) return res.sendStatus(404);

      return res.send(id.rows[0]);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  try {
    const customers = await db.query(CUSTOMERS);
    res.send(customers.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const getCustomersById = async (req, res) =>{
  try {
    const customer = await db.query('SELECT * FROM customers where "id" = $1', [req.params?.id]);

    if (customer.rows.length === 0) return res.sendStatus(404);
    return res.send(customer.rows[0]);
  } catch (err) {
    return res.status(500).send(err);
}
}
export const postCostumer = async (req, res) => {
  const joiObject = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().min(10).max(11).required(),
    cpf: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
    birthday: Joi.date().optional(),
  });
  const validadation = joiObject.validate(req.body);
  try {
    if (validadation.error) return res.sendStatus(400);
    const exist = await db.query((CUSTOMERS +' WHERE "cpf" = $1'), [req.body?.cpf]);
    if (exist.rows.length > 0) return res.sendStatus(409);

    await db.query('INSERT INTO customers ("name", "phone", "cpf", "birthday") VALUES ($1, $2, $3, $4)', 
    [req.body?.name, req.body?.phone, req.body?.cpf, req.body?.birthday]);
    res.sendStatus(201);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
export const putCostumer = async (req, res) => {
  const joiObject = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().min(10).max(11).pattern(/^[0-9]+$/).required(),
    cpf: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
    birthday: Joi.date().optional(),
  });
  const validadation = joiObject.validate(req.body);
  try {
    if (validadation.error) return res.sendStatus(400);
    const exist = await db.query('SELECT id FROM customers WHERE "cpf" = $1 AND "id" != $2', [req.body?.cpf, req.params?.id]
    );
    if (exist.rows.length > 0) return res.sendStatus(409);

    await db.query('UPDATE customers SET "name" = $1, "phone" = $2, "cpf" = $3, "birthday" = $4 WHERE "id" = $5',
    [req.body?.name, req.body?.phone, req.body?.cpf, req.body?.birthday, req.params?.id]);
    return res.sendStatus(200)
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export const getRentals = async (req, res) => {
  try {
    const data = await db.query(`
    SELECT
      r.*,
      JSON_BUILD_OBJECT('id', c.id, 'name', c.name) AS customer,
      JSON_BUILD_OBJECT('id', g.id, 'name', g.name) AS game
    FROM rentals r
    JOIN customers c ON r."customerId" = c."id"
    JOIN games g ON r."gameId" = g."id"
    `);
    return res.send(data.rows);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
export const postRental = async (req, res) => {

  const validadation = joiObject.validate(req.body)
  try {
    if(req.body?.daysRented < 0 || !Number.isInteger(req.body?.customerId) || !Number.isInteger(req.body?.gameId)) return res.sendStatus(400)
    let customerExist = await db.query('SELECT * FROM customers WHERE "id" = $1', [req.body?.customerId]);
    customerExist = customerExist.rows[0];
    if (!customerExist) return res.sendStatus(409);

    let gameExist = await db.query('SELECT * FROM games WHERE "id" = $1', [req.body?.gameId]);
    gameExist = gameExist.rows[0];
    if (!gameExist) return res.sendStatus(409);

    const totalGames = await db.query('SELECT count(id) as quantidade FROM rentals WHERE "gameId" = $1 AND "returnDate" IS NULL', [gameExist.id])
    if (gameExist.stockTotal <= totalGames.rows[0].quantidade) return res.sendStatus(400);
    const originalPrice = req.body?.daysRented * gameExist.pricePerDay
    await db.query(
      'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, null, $5, null)',
      [req.body?.customerId, req.body?.gameId, dayjs().format(), req.body?.daysRented, originalPrice],
    );
    return res.sendStatus(201);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
export async function finishRental(req, res) {
  try {
    let rental = await db.query('SELECT * FROM rentals WHERE "id" = $1', [req.params?.id]);
    rental = rental.rows[0];
    if (!rental) return res.sendStatus(404);

    if (rental.returnDate) return res.sendStatus(400);

    const returnDate = dayjs().format();

    const dateExpiresAt = dayjs(rental.rentDate).add(rental.daysRented, 'day');

    let juros = null;

    const diferenca = dayjs().diff(dateExpiresAt, 'day');

    if (diferenca > 0){ 
      juros = diferenca * (rental.originalPrice / rental.daysRented);
    }

    await db.query('UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE "id" = $3', [returnDate, juros, req.params?.id]);

    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err);
  }
};
export const deleteRental = async (req, res) => {
  try {
    let rental = await db.query('SELECT * FROM rentals WHERE "id" = $1', [req.params?.id]);
    if (!rental.rows[0]) return res.sendStatus(404);

    if (!rental.rows[0].returnDate) return res.sendStatus(400);

    await db.query('DELETE FROM rentals WHERE "id" = $1', [req.params?.id]);

    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err);
  }
};