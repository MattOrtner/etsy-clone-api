import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.USERS_TABLE;

export const deleteUserHandler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    throw new Error(
      `deleteUser only accepts DELETE method, you tried: ${event.httpMethod}`
    );
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  const body = JSON.parse(event.body);
  const email = body.email;
  const id = body.id;

  const response = {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
  };

  try {
    const isEmailRemoved = await ddbDocClient.send(
      new DeleteCommand({ TableName: tableName, Key: { id: `email#${email}` } })
    );
    console.info("isEmailRemoved", isEmailRemoved);

    const isUserRemoved = await ddbDocClient.send(
      new DeleteCommand({ TableName: tableName, Key: { id: id } })
    );
    console.info("isUserRemoved", isUserRemoved);

    response.statusCode = 200;
    response.body = JSON.stringify({ message: "User deleted sucessfully" });
  } catch (error) {
    console.info("error", error);
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );

  return response;
};
