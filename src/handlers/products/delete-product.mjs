import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const usersTable = process.env.USERS_TABLE;
const productsTable = process.env.PRODUCTS_TABLE;

export const deleteProductHandler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    throw new Error(
      `deleteUser only accepts DELETE method, you tried: ${event.httpMethod}`
    );
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  const body = JSON.parse(event.body);
  const userId = body.userId;
  const productId = body.productId;

  const response = {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
  };

  try {
    // Get user from the Users Table
    const userData = await ddbDocClient.send(
      new GetCommand({
        TableName: usersTable,
        Key: {
          id: userId,
        },
      })
    );

    console.info("userData", userData.Item);

    if (!userData.Item) {
      throw new Error("User not found");
    }

    // Update the user inventory by removing the id string from the inventory array
    const updatedInventory = userData.Item.inventory.filter(
      (id) => id !== productId
    );

    // Update the user's inventory in the Users Table
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: usersTable,
        Key: {
          id: userId,
        },
        UpdateExpression: "set inventory = :inventory",
        ExpressionAttributeValues: {
          ":inventory": updatedInventory,
        },
      })
    );

    // Delete the product from the Products Table
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: productsTable,
        Key: { id: productId },
      })
    );

    response.statusCode = 200;
    response.body = JSON.stringify({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.info("error", error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Error deleting product",
      error: error.message,
    });
  }

  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
