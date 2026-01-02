'use server';
/**
 * @fileOverview AI flow for generating location descriptions from images and metadata
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the location'),
  existingDescription: z.string().optional().describe('Existing description if any'),
  category: z.string().optional().describe('Category of the location (e.g., Academic, Dining)'),
  tags: z.array(z.string()).optional().describe('Tags associated with the location'),
  imageUrl: z.string().optional().describe('URL to the location image (if available for analysis)'),
});

const LocationDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed, engaging description of the location'),
  richDescription: z.string().optional().describe('Enhanced HTML/Markdown description with formatting'),
  suggestedTags: z.array(z.string()).optional().describe('Suggested tags for the location'),
  suggestedCategory: z.string().optional().describe('Suggested category if not provided'),
});

export type LocationDescriptionInput = z.infer<typeof LocationDescriptionInputSchema>;
export type LocationDescriptionOutput = z.infer<typeof LocationDescriptionOutputSchema>;

export async function generateLocationDescription(
  input: LocationDescriptionInput
): Promise<LocationDescriptionOutput> {
  return generateLocationDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'locationDescriptionPrompt',
  input: {schema: LocationDescriptionInputSchema},
  output: {schema: LocationDescriptionOutputSchema},
  prompt: `You are an expert content writer for a virtual tour platform.

Your task is to generate engaging, informative descriptions for locations based on their name, category, tags, and any existing information.

Location Name: {{{name}}}
{{#if category}}Category: {{{category}}}{{/if}}
{{#if tags}}Tags: {{#each tags}}{{{this}}}, {{/each}}{{/if}}
{{#if existingDescription}}Existing Description: {{{existingDescription}}}{{/if}}

Generate:
1. A compelling description (2-4 sentences) that highlights the location's features, purpose, and appeal
2. An enhanced rich description with HTML formatting (optional, can include lists, emphasis, etc.)
3. Suggested tags that would help users discover this location
4. A suggested category if one wasn't provided

Make the description engaging, informative, and suitable for a virtual tour platform. Focus on what makes this location special and what visitors can expect to see or experience.

Output in a structured format.`,
});

const generateLocationDescriptionFlow = ai.defineFlow(
  {
    name: 'generateLocationDescriptionFlow',
    inputSchema: LocationDescriptionInputSchema,
    outputSchema: LocationDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

