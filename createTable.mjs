export async function createTable({ bigquery, datasetId, tableId, schema }) {
  try {
    // Create table
    console.log(`Creating table ${tableId}...`);
    await bigquery.dataset(datasetId).createTable(tableId, { schema });
    console.log(`Table ${tableId} created successfully.`);
  } catch (error) {
    console.error(
      "An error occurred while creating, inserting, or deleting the table:",
      error
    );
  }
}
