# transfer_psql_data_to_bq

`transfer_psql_data_to_bq` is a command-line tool to transfer data from a PostgreSQL database to Google BigQuery. This tool allows you to create tables, transfer data, and send notifications to Slack.

## Installation

To install the dependencies, run:

```bash
npm install
```

## Usage

To use the tool, you can run the following command:

```bash
DATABASE_URL=<connection-string> npx transfer_psql_data_to_bq --sa-file path/to/keyfile.json --project-id my-project --dataset-id my-dataset --table-id my-table --schema-file path/to/schema.json --truncate --create-table --transfer-data --slack-notify-url https://hooks.slack.com/services/your/slack/webhook --query 'SELECT * FROM your_table'
```

## CLI Options

- `-s, --sa-file <path>`: Service Account file path (required)
- `-p, --project-id <id>`: BigQuery project ID (required)
- `-d, --dataset-id <id>`: BigQuery dataset ID (required)
- `-t, --table-id <id>`: BigQuery table ID (required)
- `-c, --schema-file <path>`: Schema file path (required)
- `--truncate`: Truncate the existing table if it exists
- `--create-table`: Create the table
- `--transfer-data`: Transfer the data
- `--slack-notify-url <url>`: Slack webhook URL for notifications
- `--query <string>`: SQL query to fetch data (required)

## Example

```bash
DATABASE_URL=postgres://user:password@host:port/dbname npx transfer_psql_data_to_bq --sa-file ./keyfile.json --project-id my-project --dataset-id my-dataset --table-id my-table --schema-file ./schema.json --truncate --create-table --transfer-data --slack-notify-url https://hooks.slack.com/services/your/slack/webhook --query 'SELECT * FROM your_table'
```

## Contact

For any issues or inquiries, please contact Kishore Renangi at [kishorer@knownuggets.com](mailto:kishorer@knownuggets.com).

## License

This project is licensed under the MIT License.

## Repository

For more information, visit the [GitHub repository](https://github.com/loctoc/transfer_psql_data_to_bq).