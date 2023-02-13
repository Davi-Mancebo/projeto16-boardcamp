import Joi from "joi";
import { db, GAMES, COSTUMERS, RENTALS } from "./database.js";
import dayjs from "dayjs";

export const getGames = async (req, res) => {
  try {
    const games = await db.query(GAMES);
    return res.send(games);
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

export const getCostumers = async (req, res) => {
  if (req.params?.id) {
    const id = await db.query(COSTUMERS + `where id = ${req.params?.id}`)
    try {
      if(!id) return res.sendStatus(404)
      const costumers = await db.query(COSTUMERS + ` where id = ${req.query?.id}`);
      return res.send(costumers.rows);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
  
  try {
    const costumers = await db.query(COSTUMERS)
    res.send(costumers.rows)
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const postCostumer = async (req, res) => {};
export const putCostumer = async (req, res) => {};

export const getRentals = async (req, res) => {};
export const postRental = async (req, res) => {};
