import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as R from "./routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get(`/games`, R.getGames);
app.post(`/games`, R.postGame);

app.get("/customers", R.getCustomers);
app.get("/customers/:id", R.getCustomersById);
app.post("/customers", R.postCostumer);
app.put("/customers/:id", R.putCostumer);

app.get("/rentals", R.getRentals);
app.post("/rentals", R.postRental);
app.post("/rentals/:id/return", R.finishRental)
app.delete("/rentals/:id", R.deleteRental)

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
