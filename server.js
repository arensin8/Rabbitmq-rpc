const amqp = require("amqplib");
const argv = process.argv.slice(2);
const queueName = "rpc";
const { v4: uuid } = require("uuid");

async function processTask() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    console.log("Im waiting to get new task");

    channel.consume(queueName, (msg) => {
      console.log("Received :", msg.content.toString());
      const data = parseInt(msg.content.toString());
      let temp = 0;
      for (let index = 1; index <= data; index++) {
        temp += data * index;
      }
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(temp.toString()),
        {
          correlationId: msg.properties.correlationId,
        }
      );
      channel.ack(msg);
    });
  } catch (error) {
    console.error("Error in processTask:", error);
  }
}

processTask();
