#!/usr/bin/env node
import { BigQuery } from "@google-cloud/bigquery";
import fs from "fs";
import { Command } from "commander";
import { readFileSync } from "fs";
import { createTable } from "./createTable.mjs";
import { runQueryWithCursor } from "./psql.mjs";
import axios from "axios";

const program = new Command();

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url))
);

program
  .version(packageJson.version) // Use version from package.json
  .requiredOption("-s, --sa-file <path>", "Service Account file path")
  .requiredOption("-p, --project-id <id>", "BigQuery project ID")
  .requiredOption("-d, --dataset-id <id>", "BigQuery dataset ID")
  .requiredOption("-t, --table-id <id>", "BigQuery table ID")
  .requiredOption("-c, --schema-file <path>", "Schema file path")
  .option("--truncate", "Truncate the existing table if it exists")
  .option("--create-table", "Create the table")
  .option("--transfer-data", "Transfer the data")
  .option("--slack-notify-url <url>", "Slack webhook URL for notifications")
  .requiredOption("--query <string>", "SQL query to fetch data")
  .on("--help", () => {
    console.log("");
    console.log("Example call:");
    console.log(
      "  $ DATABASE_URL=<connection-string> npx transfer_psql_data_to_bq --sa-file path/to/keyfile.json --project-id my-project --dataset-id my-dataset --table-id my-table --schema-file path/to/schema.json --truncate --create-table --transfer-data --slack-notify-url https://hooks.slack.com/services/your/slack/webhook --query 'SELECT * FROM your_table'"
    );
  })
  .parse(process.argv);

const options = program.opts();

// Initialize BigQuery client with the Service Account key
const keyFile = JSON.parse(fs.readFileSync(options.saFile, "utf8"));
const bigquery = new BigQuery({
  projectId: options.projectId,
  credentials: keyFile,
});

if (options.createTable) {
  console.log("Creating table...");
  const schema = JSON.parse(fs.readFileSync(options.schemaFile, "utf8"));
  console.time("createTable");
  await createTable({
    bigquery,
    datasetId: options.datasetId,
    tableId: options.tableId,
    schema,
  });
  console.timeEnd("createTable");
} else if (options.transferData && options.query) {
  const startTime = new Date();
  const slackMessage = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `PSQL data sync to BQ \`${options.projectId}.${options.datasetId}.${options.tableId}\``,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Started At: *${startTime.toISOString()}*`,
      },
    },
  ];
  try {
    const schema = JSON.parse(fs.readFileSync(options.schemaFile, "utf8"));
    console.log("Transferring data...");

    // Step 1: Write line-separated JSON to a file
    console.time("writeJSONToFile");
    const jsonFilePath = "./data.json";
    const writeStream = fs.createWriteStream(jsonFilePath, { flags: "w" });

    const rowCount = await runQueryWithCursor(options.query, (rows) => {
      rows.forEach((row) => {
        const transformedRow = transformRow(row, schema);
        writeStream.write(JSON.stringify(transformedRow) + "\n");
      });
    });
    writeStream.end();
    console.timeEnd("writeJSONToFile");
    slackMessage.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Rows: *${rowCount}*`,
      },
    });

    // Step 2: Load the JSON file into BigQuery
    console.time("loadJSONToBigQuery");
    const table = bigquery.dataset(options.datasetId).table(options.tableId);

    await table.load(jsonFilePath, {
      sourceFormat: "NEWLINE_DELIMITED_JSON",
      writeDisposition: options.truncate ? "WRITE_TRUNCATE" : "WRITE_APPEND",
    });
    console.timeEnd("loadJSONToBigQuery");

    console.log("Data transferred successfully.");
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // duration in seconds
    slackMessage.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Finished At: ${endTime.toISOString()} - in ${duration.toFixed(
          2
        )} seconds`,
      },
    });
    slackMessage.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Status: Success`,
      },
    });
    await sendSlackMessage(slackMessage);
    process.exit(0);
  } catch (error) {
    console.error(
      "An error occurred while transferring data:",
      error,
      error.stack
    );
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // duration in seconds
    slackMessage.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Finished At: ${endTime.toISOString()} in *${duration.toFixed(
          2
        )} seconds*`,
      },
    });
    slackMessage.push({
      type: "section",
      text: {
      type: "mrkdwn",
      text: `*Error:* <!channel> \`${error.message}\``,
      },
    });
    await sendSlackMessage(slackMessage);
    process.exit(1);
  }
}

async function sendSlackMessage(blocks) {
  if (options.slackNotifyUrl) {
    const body = {
      blocks,
    };
    try {
      await axios.post(
        options.slackNotifyUrl,
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "An error occurred while sending Slack notification:",
        error,
        error.stack
      );
    }
  }
}

function transformRow(row, schema) {
  const transformedRow = {};
  schema.forEach((field) => {
    if (
      field.type === "NUMERIC" &&
      row[field.name] !== null &&
      row[field.name] !== undefined
    ) {
      transformedRow[field.name] = parseFloat(row[field.name]).toFixed(2);
    } else {
      transformedRow[field.name] = row[field.name];
    }
  });
  return transformedRow;
}
