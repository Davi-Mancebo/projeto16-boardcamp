import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as R from "./routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get(`/games`, R.getGames)
app.post(`/games`, R.postGame)

app.get("/costumers", R.getCostumers)
app.get("/costumers/:id", R.getCostumers)
app.post("/costumers", R.postCostumer)
app.put("/costumers/:id", R.putCostumer)

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
