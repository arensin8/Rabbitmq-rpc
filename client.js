const amqp = require("amqplib");
const args = process.argv.slice(2);
const queueName = "rpc";
const { v4: uuid } = require("uuid");

if (args.length === 0) {
  console.error("Usage: node client.js <number>");
  process.exit(1);
}

const numberToProcess = args[0];

async function sendTaskToProcess() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();
    const assertedQueue = await channel.assertQueue("", { exclusive: true });

    const correlationId = uuid();
    channel.sendToQueue(queueName, Buffer.from(numberToProcess), {
      replyTo: assertedQueue.queue,
      correlationId: correlationId,
    });

    channel.consume(assertedQueue.queue, (msg) => {
      if (msg.properties.correlationId === correlationId) {
        console.log("Process done:", msg.content.toString());
        channel.ack(msg);
        setTimeout(() => {
          connection.close();
          process.exit(0);
        }, 1000);
      }
    });
  } catch (error) {
    console.error("Error in sendTaskToProcess:", error);
  }
}

sendTaskToProcess();
