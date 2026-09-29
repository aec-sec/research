import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const research = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/research',
	}),

	schema: z.object({
		title: z.string(),
		description: z.string(),

		published: z.coerce.date(),
		updated: z.coerce.date().optional(),

		category: z.enum([
			'CVE Research',
			'Web Security',
			'Infrastructure',
			'Red Team',
			'General Research',
		]),

		tags: z.array(z.string()).default([]),

		severity: z
			.enum([
				'Critical',
				'High',
				'Medium',
				'Low',
				'Informational',
				'N/A',
			])
			.optional(),

		cve: z.string().optional(),

		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

export const collections = {
	research,
};