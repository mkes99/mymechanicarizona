import { defineCollection, z } from "astro:content";

const services = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    orderTitle: z.string().optional(),
  }),
});

export const collections = { services };