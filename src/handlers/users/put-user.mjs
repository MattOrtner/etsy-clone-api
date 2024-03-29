import { v4 as uuidv4 } from "uuid";

// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.USERS_TABLE;
import bcrypt from "bcryptjs";
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const putUserHandler = async (event) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);

  // Get id and name from the body of the request
  const body = JSON.parse(event.body);
  const id = uuidv4();
  const name = body.name;
  const email = body.email;
  const password = body.password;

  // Build User Object for params
  const user = {
    id: id,
    name: name,
    email: email,
    isSignedIn: true,
    favoriteProducts: [],
    shoppingCart: [],
    storeName: "Fake Shop Name",
    inventory: [],
  };
  if (password) {
    const salt = bcrypt.genSaltSync(8);
    const hash = bcrypt.hashSync(password, salt);
    user.password = hash;
  }
  // Creates a new user, or replaces an old user with a new user
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  var params = {
    TableName: tableName,
    Item: user,
  };
  const response = {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere
      "Access-Control-Allow-Methods": "*", // Allow only GET request
    },
  };
  console.log("user", user);
  try {
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          id: `email#${email}`,
        },
        AttributesToGet: ["id"],
      })
    );

    if (result.Item === undefined) {
      const data = await ddbDocClient.send(new PutCommand(params));
      const addEmailAsKey = await ddbDocClient.send(
        new PutCommand({
          TableName: tableName,
          Item: { id: `email#${email}`, userId: id },
        })
      );
      console.log("Success - item added User: ", data);
      console.log("Success - added Email as pk: ", addEmailAsKey);
      response.statusCode = 200;
      response.body = JSON.stringify({ ...user, password: "" });
    } else {
      response.statusCode = 409;
      response.body = JSON.stringify({ message: "Email already exists" });
    }
  } catch (err) {
    //   should return status(500)
    //   body has error message

    console.log("Error", err.stack);
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
