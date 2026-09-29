import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const quizSchema = z.array(
	z.object({
		question: z.string(),
		answers: z.array(z.string()).length(4),
		correct: z.number().int().min(0).max(3),
		explanation: z.string().optional(),
	})
).min(1).max(20).optional();

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
        homepage: z.boolean().default(false),
		draft: z.boolean().default(false),
        quiz: quizSchema,
	}),
});

const findings = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/findings',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),

		severity: z.enum([
			'Critical',
			'High',
			'Medium',
			'Low',
			'Informational',
			'N/A',
		]),

		category: z.enum([
			'Access Control',
			'Authentication',
			'Authorisation',
			'Cryptography',
			'Configuration',
			'Error Handling',
			'Information Disclosure',
			'Injection',
			'Network Security',
			'Session Management',
			'Transport Security',
			'Third-Party Components',
			'Other',
		]),

		cwe: z.string().optional(),
		owasp: z.string().optional(),

		tags: z.array(z.string()).default([]),

		draft: z.boolean().default(false),
	}),
});

const labs = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/labs',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		published: z.coerce.date(),
		updated: z.coerce.date().optional(),

		platform: z.enum([
			'Hack The Box',
			'TryHackMe',
			'PortSwigger',
			'Custom Lab',
			'CTF',
			'Other',
		]),

		category: z.enum([
			'Web',
			'Active Directory',
			'Linux',
			'Windows',
			'Network',
			'Cloud',
			'Exploit Development',
			'Mixed',
		]),

		difficulty: z.enum([
			'Easy',
			'Medium',
			'Hard',
			'Insane',
			'N/A',
		]).default('N/A'),

		os: z.enum([
			'Linux',
			'Windows',
			'Multiple',
			'N/A',
		]).default('N/A'),

		tags: z.array(z.string()).default([]),

		featured: z.boolean().default(false),
        homepage: z.boolean().default(false),
		draft: z.boolean().default(false),
        quiz: quizSchema,
	}),
});

const protocols = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/protocols',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),

		port: z.string(),
		transport: z.enum([
			'TCP',
			'UDP',
			'TCP/UDP',
			'Other',
		]),

		category: z.enum([
			'Web',
			'Remote Access',
			'File Sharing',
			'Email',
			'Directory Services',
			'Name Resolution',
			'Network Management',
			'Database',
			'Infrastructure',
			'Other',
		]),

		tags: z.array(z.string()).default([]),
        homepage: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

export const collections = {
	research,
	findings,
    labs,
    protocols,
};