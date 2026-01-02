'use server';
/**
 * @fileOverview A flow for generating personalized campus tour recommendations based on user interests.
 *
 * - generateTourRecommendations - A function that generates tour recommendations.
 * - TourRecommendationInput - The input type for the generateTourRecommendations function.
 * - TourRecommendationOutput - The return type for the generateTourRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TourRecommendationInputSchema = z.object({
  interests: z
    .string()
    .describe(
      'The interests of the user, such as history, architecture, or student life.'
    ),
  availableLocations: z.array(z.string()).describe('A list of available campus locations.'),
  availableMaps: z.array(z.string()).optional().describe('A list of available campus maps.'),
});
export type TourRecommendationInput = z.infer<typeof TourRecommendationInputSchema>;

const TourRecommendationOutputSchema = z.object({
  tourName: z
    .string()
    .describe('A creative and engaging name for the generated tour.'),
  tourDescription: z
    .string()
    .describe('A summary of the tour and the reasoning behind the recommendations.'),
  recommendedLocations: z
    .array(z.string())
    .describe(
      'A list of campus locations recommended for the user, based on their interests.'
    ),
  recommendedMaps: z
    .array(z.string())
    .optional()
    .describe(
      'A list of campus maps recommended for the user, based on their interests.'
    ),
});
export type TourRecommendationOutput = z.infer<typeof TourRecommendationOutputSchema>;

export async function generateTourRecommendations(
  input: TourRecommendationInput
): Promise<TourRecommendationOutput> {
  return generateTourRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tourRecommendationPrompt',
  input: {schema: TourRecommendationInputSchema},
  output: {schema: TourRecommendationOutputSchema},
  prompt: `You are an expert tour guide for a virtual tour platform.

You will receive a list of available locations (with their categories and tags), maps, and the interests of the user.
Based on the user's interests, you will generate a creative tour name, recommend a list of locations and/or maps that they should visit, and provide a short, engaging description for the tour that explains why these locations and maps are relevant.

IMPORTANT: When matching user interests to locations, pay special attention to:
- Categories (e.g., "Academic", "Dining", "Recreational", "Cultural")
- Tags (e.g., "library", "café", "gym", "art")
- Location descriptions

User Interests: {{{interests}}}
Available Locations (format: Name [Category: X] [Tags: tag1, tag2] - Description): {{#each availableLocations}}{{{this}}}, {{/each}}
{{#if availableMaps}}Available Maps: {{#each availableMaps}}{{{this}}}, {{/each}}{{/if}}

You can recommend both locations (360° panoramic views) and maps (2D floor plans) based on what best matches the user's interests. For example, if they're interested in navigation or layout, recommend maps. If they're interested in experiencing spaces, recommend locations.

When returning recommended locations, return ONLY the location name (without the category, tags, or description).

Output the tour name, tour description, recommended locations, and optionally recommended maps in a structured format.
`,
});

const generateTourRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateTourRecommendationsFlow',
    inputSchema: TourRecommendationInputSchema,
    outputSchema: TourRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
