import { Job, Queue, Worker } from "bullmq";
import fastifyPlugin from "fastify-plugin";
import got, { HTTPError } from "got";
import { WebhookData } from "../handlers/webhook";

export const FORWARD_WEBHOOK_QUEUE_NAME = "envoi_app:forward_webhook";
export const FORWARD_WEBHOOK_JOB_NAME = "envoi_app:forward_webhook";

const queue = fastifyPlugin(
  async (app) => {
    const redisUrl = new URL(app.env.REDIS_URL);
    // Start queue
    const forwardWebhookQ = new Queue(FORWARD_WEBHOOK_QUEUE_NAME, {
      connection: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port),
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 6,
        backoff: {
          type: "fixed",
          delay: 3000,
        },
      },
    });

    new Worker(
      FORWARD_WEBHOOK_JOB_NAME,
      async (data: Job<{ target: { value: string }; data: WebhookData }>) => {
        const { data: jobData } = data;

        app.log.info(
          { target: jobData.target },
          "Processing webhook forward job"
        );

        const {
          target: { value: webhookTarget },
        } = jobData;

        try {
          await got(webhookTarget, {
            allowGetBody: true,
            method: jobData?.data?.method as any,
            json: jobData?.data?.body,
            searchParams: jobData?.data?.queryString,
            retry: {
              limit: 0,
            },
          });
        } catch (error) {
          if (error instanceof HTTPError) {
            app.log.error(
              {
                statusCode: error?.response?.statusCode,
                responseBody: error?.response?.body,
                responseHeaders: error?.response?.headers,
              },
              "HTTP Request Error during forwarding"
            );
          } else app.log.error(error, "Unexpected error during forwarding");
          throw error;
        }

        return "ok";
      },
      {
        connection: {
          host: redisUrl.hostname,
          port: parseInt(redisUrl.port),
        },
      }
    );

    app.decorate("queue", { forwardWebhookQ });
  },
  { fastify: "^4.15.0", name: "queue" }
);

export default queue;
