#!/usr/bin/env node
import { BigQuery } from "@google-cloud/bigquery";
import fs from "fs";
import { Command } from "commander";
import { readFileSync } from "fs";
import { deleteTable, createTable } from "./createTable.mjs";
import { runQueryWithCursor } from "./psql.mjs";
import axios from "axios";

const options = {
  saFile: "./TalabatBQServiceAccount.json",
  projectId: "tlb-data-dev",
  datasetId: "tlb_cartwheel_data_external",
  tableId: "shifts_attendance",
  schemaFile: "./schema.json",
};

// Initialize BigQuery client with the Service Account key
const keyFile = JSON.parse(fs.readFileSync(options.saFile, "utf8"));
const bigquery = new BigQuery({
  projectId: options.projectId,
  credentials: keyFile,
});

console.log("Creating table...");
const schema = JSON.parse(fs.readFileSync(options.schemaFile, "utf8"));
try {
  // console.time("deleteTable");
  // await deleteTable({
  //   bigquery,
  //   datasetId: options.datasetId,
  //   tableId: options.tableId,
  //   schema,
  // });
  // console.timeEnd("deleteTable");

  console.time("createTable");
  await createTable({
    bigquery,
    datasetId: options.datasetId,
    tableId: options.tableId,
    schema,
  });
  console.timeEnd("createTable");
} catch (error) {
  console.log(error, error.stack);
}