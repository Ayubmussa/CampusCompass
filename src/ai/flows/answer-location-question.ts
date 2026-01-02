'use server';
/**
 * @fileOverview AI flow for answering questions about locations
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about a location or the platform'),
  locationContext: z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    openingHours: z.record(z.string(), z.any()).optional(),
    contactInfo: z.record(z.string(), z.any()).optional(),
    pricingInfo: z.string().optional(),
  }).optional().describe('Context about the current location if relevant'),
  availableLocations: z.array(z.string()).optional().describe('List of available location names for reference'),
  availablePlaces: z.array(z.string()).optional().describe('List of available places with descriptions for reference'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Previous conversation messages for context'),
});

const LocationQuestionOutputSchema = z.object({
  answer: z.string().describe('A helpful, accurate answer to the user\'s question'),
  suggestedLocations: z.array(z.string()).optional().describe('Location names that might be relevant to the question'),
  followUpQuestions: z.array(z.string()).optional().describe('Suggested follow-up questions the user might want to ask'),
});

export type LocationQuestionInput = z.infer<typeof LocationQuestionInputSchema>;
export type LocationQuestionOutput = z.infer<typeof LocationQuestionOutputSchema>;

export async function answerLocationQuestion(
  input: LocationQuestionInput
): Promise<LocationQuestionOutput> {
  return answerLocationQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'locationQuestionPrompt',
  input: {schema: LocationQuestionInputSchema},
  output: {schema: LocationQuestionOutputSchema},
  prompt: `You are a helpful virtual tour assistant. Answer questions about locations, tours, and the platform.

User Question: {{{question}}}

{{#if locationContext}}
Current Location Context:
- Name: {{{locationContext.name}}}
{{#if locationContext.description}}- Description: {{{locationContext.description}}}{{/if}}
{{#if locationContext.category}}- Category: {{{locationContext.category}}}{{/if}}
{{#if locationContext.tags}}- Tags: {{#each locationContext.tags}}{{{this}}}, {{/each}}{{/if}}
{{#if locationContext.openingHours}}- Opening Hours: Available{{/if}}
{{#if locationContext.contactInfo}}- Contact Info: Available{{/if}}
{{#if locationContext.pricingInfo}}- Pricing: {{{locationContext.pricingInfo}}}{{/if}}
{{/if}}

{{#if availableLocations}}
Available Locations: {{#each availableLocations}}{{{this}}}, {{/each}}
{{/if}}

{{#if availablePlaces}}
Available Places: {{#each availablePlaces}}{{{this}}}, {{/each}}
{{/if}}

{{#if conversationHistory}}
Previous Conversation:
{{#each conversationHistory}}
{{{role}}}: {{{content}}}
{{/each}}
{{/if}}

Provide:
1. A clear, helpful answer to the question
2. If relevant, suggest locations that might interest the user
3. Suggest 2-3 follow-up questions that might be helpful

Be conversational, friendly, and informative. If you don't know something, say so and suggest how the user might find the information.`,
});

const answerLocationQuestionFlow = ai.defineFlow(
  {
    name: 'answerLocationQuestionFlow',
    inputSchema: LocationQuestionInputSchema,
    outputSchema: LocationQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

