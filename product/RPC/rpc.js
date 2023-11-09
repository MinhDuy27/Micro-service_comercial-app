const amqplib = require("amqplib");
const { v4: uuid4 } = require("uuid");
const productmodel = require("../Database/models/products");
let amqplibConnection = null;

const getChannel = async () => {
  if (amqplibConnection === null) {
    amqplibConnection = await amqplib.connect("amqps://cxvogkfm:C9BHzMSk3Lvv9tUdm6GY21fBjW9x1zV2@octopus.rmq3.cloudamqp.com/cxvogkfm");
  }
  return await amqplibConnection.createChannel();
};

const RPCObserver = async (RPC_QUEUE_NAME) => {
  const channel = await getChannel();
  await channel.assertQueue(RPC_QUEUE_NAME, {
    durable: false,
  });
  channel.prefetch(1);
  channel.consume(
    RPC_QUEUE_NAME,
    async (msg) => {
    if (msg.content) {
        // DB Operation
        const payload = JSON.parse(msg.content.toString());
        const {productid} = payload;
        const response =  await productmodel.findById(productid);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    }
  );
};

const requestData = async (RPC_QUEUE_NAME, requestPayload, uuid) => {
  try {
    const channel = await getChannel();

    const q = await channel.assertQueue("", { exclusive: true });

    channel.sendToQueue(
      RPC_QUEUE_NAME,
      Buffer.from(JSON.stringify(requestPayload))//content
      ,{
        replyTo: q.queue,
        correlationId: uuid,
      }//properties 
    );

    return new Promise((resolve, reject) => {
      // timeout n
      const timeout = setTimeout(() => {
        channel.close();
        resolve("API could not fullfil the request!");
      }, 8000);
      channel.consume(
        q.queue,
        (msg) => {
          if (msg.properties.correlationId == uuid) {
            resolve(JSON.parse(msg.content.toString()));
            clearTimeout(timeout);
          } else {
            reject("data Not found!");
          }
        },
        {
          noAck: true,
        }
      );
    });
  } catch (error) {
    console.log(error);
    return "error";
  }
};

const RPCRequest = async (RPC_QUEUE_NAME, requestPayload) => {
  const uuid = uuid4(); // correlationId
  return await requestData(RPC_QUEUE_NAME, requestPayload, uuid);
};

module.exports = {
  getChannel,
  RPCObserver,
  RPCRequest,
};

    
