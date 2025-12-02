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
  prompt: `You are an expert tour guide for a university campus.

You will receive a list of available campus locations and the interests of the user.
Based on the user's interests, you will generate a creative tour name, recommend a list of campus locations that they should visit, and provide a short, engaging description for the tour that explains why these locations are relevant.

User Interests: {{{interests}}}
Available Locations: {{#each availableLocations}}{{{this}}}, {{/each}}

Output the tour name, tour description, and recommended locations in a structured format.
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
