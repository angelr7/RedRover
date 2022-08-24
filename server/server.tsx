import express from "express";
import { PORT } from "../constants/network";

/**
 * App initialization and route definitions
 */
const app = express();

app.post("/user/initialize", (request, response) => {
  response.status(200).send({ response: "All good!" });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
