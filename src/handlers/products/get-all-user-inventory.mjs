import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const usersTable = process.env.USERS_TABLE;
const productsTable = process.env.PRODUCTS_TABLE;

console.info("usersTable", usersTable);
console.info("productsTable", productsTable);

export const getAllUserInventoryHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `getAllInventory only accepts GET method, you tried: ${event.httpMethod}`
    );
  }

  console.info("recieved: ", event);

  const id = event.pathParameters.id;

  const response = {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
  };

  try {
    // Get Command for userObj

    const user = await ddbDocClient.send(
      new GetCommand({ TableName: usersTable, Key: { id: id } })
    );

    if (
      !user.Item ||
      !user.Item.inventory ||
      user.Item.inventory.length === 0
    ) {
      // Handle the case where the user or their inventory is not found
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: "User or inventory not found",
      });
    } else {
      // Batch Get Command to get all the info for their store products
      const productKeys = user.Item.inventory.map((productId) => ({
        id: productId,
      }));

      // Batch Get Command to get all the info for their store products
      const products = await ddbDocClient.send(
        new BatchGetCommand({
          RequestItems: {
            [productsTable]: {
              Keys: productKeys,
            },
          },
        })
      );
      console.info("products", products);
      response.statusCode = 200;
      response.body = JSON.stringify({
        products: products.Responses[productsTable],
      });
    }
  } catch (error) {
    console.error("error", error);
    response.statusCode = 500;
    response.body = JSON.stringify({ message: "Error fetching inventory" });
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
