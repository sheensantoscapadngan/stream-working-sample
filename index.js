require("dotenv").config();
const express = require("express");
const { writeFile } = require("fs");
const { promisify } = require("util");

const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  },
  pool: { min: 0, max: 7 },
});

const app = express();
const promisifiedWriteFile = promisify(writeFile);

app.get("/", async (req, res) => {
  try {
    const transactions = await knex
      .select("sender", "receiver", "amount")
      .from("transactions");

    const formattedString = transactions.reduce((accumulator, transaction) => {
      const formattedEntry = `Sender:${transaction.sender} | Receiver: ${transaction.receiver} | Amount: ${transaction.amount}\n`;

      return accumulator.concat(formattedEntry);
    }, "");

    await promisifiedWriteFile("report.txt", formattedString);
  } catch (err) {
    console.error("AN ERROR OCCURED.", err);
  }

  return res.send("DONE.");
});

app.listen(3000, () => {
  console.log("LISTENING ON PORT 3000");
});
