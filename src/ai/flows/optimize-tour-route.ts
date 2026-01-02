'use server';
/**
 * @fileOverview AI flow for optimizing tour routes based on constraints
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TourOptimizationInputSchema = z.object({
  selectedLocations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    category: z.string().optional(),
    estimatedTime: z.number().optional().describe('Estimated time to visit in minutes'),
  })).describe('Locations selected for the tour'),
  constraints: z.object({
    maxTime: z.number().optional().describe('Maximum time available in minutes'),
    preferredCategories: z.array(z.string()).optional().describe('Preferred location categories'),
    avoidCrowded: z.boolean().optional().describe('Avoid crowded locations if possible'),
    accessibilityNeeds: z.array(z.string()).optional().describe('Accessibility requirements'),
    timeOfDay: z.string().optional().describe('Time of day (morning, afternoon, evening, night)'),
  }).optional(),
  userInterests: z.string().optional().describe('User interests for context'),
});

const TourOptimizationOutputSchema = z.object({
  optimizedRoute: z.array(z.string()).describe('Optimized order of location IDs'),
  estimatedDuration: z.number().describe('Total estimated duration in minutes'),
  routeDescription: z.string().describe('Description of the optimized route'),
  suggestions: z.array(z.string()).optional().describe('Suggestions for the tour'),
});

export type TourOptimizationInput = z.infer<typeof TourOptimizationInputSchema>;
export type TourOptimizationOutput = z.infer<typeof TourOptimizationOutputSchema>;

export async function optimizeTourRoute(
  input: TourOptimizationInput
): Promise<TourOptimizationOutput> {
  return optimizeTourRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tourOptimizationPrompt',
  input: {schema: TourOptimizationInputSchema},
  output: {schema: TourOptimizationOutputSchema},
  prompt: `You are an expert tour route optimizer for a virtual tour platform.

Your task is to optimize the order of locations in a tour based on:
- Geographic proximity (if coordinates are available)
- Time constraints
- User preferences
- Time of day considerations
- Accessibility needs

Selected Locations: {{#each selectedLocations}}
- {{{name}}} (ID: {{{id}}}){{#if coordinates}} - Coordinates: {{{coordinates.lat}}}, {{{coordinates.lng}}}{{/if}}{{#if category}} - Category: {{{category}}}{{/if}}{{#if estimatedTime}} - Est. time: {{{estimatedTime}}} min{{/if}}
{{/each}}

{{#if constraints}}
Constraints:
{{#if constraints.maxTime}}- Maximum time: {{{constraints.maxTime}}} minutes{{/if}}
{{#if constraints.preferredCategories}}- Preferred categories: {{#each constraints.preferredCategories}}{{{this}}}, {{/each}}{{/if}}
{{#if constraints.avoidCrowded}}- Avoid crowded locations{{/if}}
{{#if constraints.accessibilityNeeds}}- Accessibility needs: {{#each constraints.accessibilityNeeds}}{{{this}}}, {{/each}}{{/if}}
{{#if constraints.timeOfDay}}- Time of day: {{{constraints.timeOfDay}}}{{/if}}
{{/if}}

{{#if userInterests}}
User Interests: {{{userInterests}}}
{{/if}}

Optimize the route to:
1. Minimize travel distance (if coordinates available)
2. Respect time constraints
3. Match user preferences
4. Consider time of day (e.g., dining locations in meal times)
5. Ensure accessibility if needed

Return the optimized order of location IDs, estimated total duration, a route description, and helpful suggestions.`,
});

const optimizeTourRouteFlow = ai.defineFlow(
  {
    name: 'optimizeTourRouteFlow',
    inputSchema: TourOptimizationInputSchema,
    outputSchema: TourOptimizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

