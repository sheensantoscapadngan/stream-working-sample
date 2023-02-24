require("dotenv").config();
const express = require("express");
const { createWriteStream } = require("fs");
const { Transform, pipeline } = require("stream");
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
const promisifiedPipeline = promisify(pipeline);

app.get("/", async (req, res) => {
  const fileStream = createWriteStream("report.txt");

  const transformer = new Transform({
    writableObjectMode: true,
    transform(row, encoding, callback) {
      const formattedRow = `Sender:${row.sender} | Receiver: ${row.receiver} | Amount: ${row.amount}\n`;
      callback(null, formattedRow);
    },
  });

  try {
    const resultStream = knex("transactions")
      .select("sender", "receiver", "amount")
      .stream({
        highWaterMark: 1000,
      });

    await promisifiedPipeline(resultStream, transformer, fileStream);
  } catch (err) {
    console.error("AN ERROR OCCURED.", err);
  }

  return res.send("DONE.");
});

app.listen(3000, () => {
  console.log("LISTENING ON PORT 3000");
});
