// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.USERS_TABLE;

/**
 * A simple example includes a HTTP get method to get all users from a DynamoDB table.
 */
export const getAllUsersHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `getAllusers only accept GET method, you tried: ${event.httpMethod}`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);

  // get all Users from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
  var params = {
    TableName: tableName,
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    var users = data.Users;
    console.log("users", users);
    var items = data.Items;
    console.log("items", items);
  } catch (err) {
    console.log("Error", err);
  }

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
    body: JSON.stringify(users),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};