import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const configDatabase = {
  connectionString: process.env.DATABASE_URL,
};

export const db = new Pool(configDatabase);

export const [GAMES, COSTUMERS, RENTALS] = [
  "games",
  "costumers",
  "rentals"
].map((c) => `SELECT * FROM ${c}`);
