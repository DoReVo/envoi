import { Job, Queue, Worker } from "bullmq";
import fastifyPlugin from "fastify-plugin";
import got from "got";
import { WebhookData } from "../handlers/webhook";

export const FORWARD_WEBHOOK_QUEUE_NAME = "envoi_app:forward_webhook";
export const FORWARD_WEBHOOK_JOB_NAME = "envoi_app:forward_webhook";

const queue = fastifyPlugin(
  async (app) => {
    // Start queue
    const forwardWebhookQ = new Queue(FORWARD_WEBHOOK_QUEUE_NAME, {
      connection: {
        host: app.env.REDIS_HOST,
        port: app.env.REDIS_PORT,
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

    const worker = new Worker(
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
          app.log.error(error, "Error during forwarding");
          throw error;
        }

        return "ok";
      },
      {
        connection: {
          host: app.env.REDIS_HOST,
          port: app.env.REDIS_PORT,
        },
      }
    );

    app.decorate("queue", { forwardWebhookQ });
  },
  { fastify: "^4.15.0", name: "queue" }
);

export default queue;
