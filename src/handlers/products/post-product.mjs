import { v4 as uuidv4 } from "uuid";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE;
const usersTable = process.env.USERS_TABLE;

export const postProductHandler = async (event) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `postProduct only accepts POST method, you tried: ${event.httpMethod} method.`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);

  //  sellerId
  const body = JSON.parse(event.body);
  const newProduct = { ...body, id: uuidv4() };
  console.info("newProduct spread from body: ", newProduct);

  var params = {
    TableName: productsTable,
    Item: newProduct,
  };

  const response = {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
  };

  try {
    // GetCommand to see if user exists with sellerId
    const ifSellerResult = await ddbDocClient.send(
      new GetCommand({
        TableName: usersTable,
        Key: {
          id: newProduct.sellerId,
        },
        AttributesToGet: ["id"],
      })
    );
    // if there is no user
    if (ifSellerResult.Item === undefined) {
      response.body = JSON.stringify({ message: "User does not exists" });
      response.statusCode = 401;
      return response;
    }

    // PutCommand the newProduct into the products table
    const productAddResult = await ddbDocClient.send(new PutCommand(params));

    // Update the sellers inventory with the  newProduct's ID
    const updateSellerResult = await ddbDocClient.send(
      new UpdateCommand({
        TableName: usersTable,
        Key: {
          id: newProduct.sellerId,
        },
        UpdateExpression: "set inventory = list_append(inventory, :inventory)",
        ExpressionAttributeValues: {
          ":inventory": [newProduct.id],
        },
      })
    );
    console.info("updateSellerResult", updateSellerResult);
    console.info("productAddResult", productAddResult);

    response.statusCode = 200;
    response.body = JSON.stringify({
      message: "product added to inventory",
      Item: updateSellerResult,
    });

    return response;
  } catch (error) {
    console.info("error", error);
  }
};
