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
    if (validadation.error) {
      return res.sendStatus(400);
    }
    const exist = await db.query(GAMES + ` where name = '${req.body?.name}'`);
    if (exist) {
      return res.sendStatus(409);
    }
    await db.query(
      `insert into games values 
      ((SELECT MAX(id)+1 FROM games),
      '${req.body?.name}',
      '${req.body?.image}',
      ${req.body?.stockTotal},
      ${req.body?.pricePerDay});`
    );
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
export const postCostumer = async (req, res) => {
  const joiObject = Joi.object({
    name: Joi.string().required(),
    phone: Joi.number().min(10).max(11),
    cpf: Joi.number().only(11),
    birthday: Joi.date(),
  });
  const validadation = joiObject.validate(req.body);
  try {
    if (validadation.error) return res.sendStatus(400);
    const exist = await db.query(CUSTOMERS + ` where cpf = ${req.body?.cpf}`);
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
    phone: Joi.number().min(10).max(11),
    cpf: Joi.number().only(11),
    birthday: Joi.date(),
  });
  const validadation = joiObject.validate(req.body);
  try {
    if (validadation.error) return res.sendStatus(400);
    const exist = await db.query('SELECT id FROM customers WHERE "cpf" = $1 AND "id" != $2', [req.body?.cpf, req.params?.id]
    );
    if (exist.rows.length > 0) return res.sendStatus(409);

    await db.query('UPDATE customers SET "name" = $1, "phone" = $2, "cpf" = $3, "birthday" = $4 WHERE "id" = $5',
    [req.body?.name, req.body?.phone, req.body?.cpf, req.body?.birthday, req.params?.id]);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export const getRentals = async (req, res) => {
  try {
    const data = await db.query(`
    SELECT 
      id,
      customerId,
      gameId,
      rentDate,
      daysRented,
      returnDate,
      originalPrice,
      () as delayFee,
      (SELECT * FROM costumers where id = rentals.customerId) as customer,
      (SELECT * FROM game WHERE id = rentals.gameId)
    FROM rentals
    `);
    return res.send(data.rows);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
export const postRental = async (req, res) => {
  const today = dayjs.format("YYYY-MM-DD");
  const costumerExist = await db.query(CUSTOMERS + ` where id = ${req.body?.costumerId}`)
  const gameExist = await db.query(GAMES + ` where id = ${req.body?.gameId}`)

  try {
    await db.query(
      `insert into rentals values 
      ((SELECT MAX(id)+1 FROM rentals),
      ${req.body?.costumerId},
      ${req.body?.gameId},
      ${today},
      ${req.body?.daysRented}),
      null,
      ${originalPrice},
      null;`
    );
    return res.sendStatus(201);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export const putRenal = async (req, res) => {};
