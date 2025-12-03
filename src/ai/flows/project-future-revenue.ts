'use server';

/**
 * @fileOverview Projects future revenue based on historical data and current booking trends.
 *
 * - projectFutureRevenue - A function that projects future revenue.
 * - ProjectFutureRevenueInput - The input type for the projectFutureRevenue function.
 * - ProjectFutureRevenueOutput - The return type for the projectFutureRevenue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectFutureRevenueInputSchema = z.object({
  historicalData: z.string().describe('Historical booking data as a JSON string.'),
  currentTrends: z.string().describe('Current booking trends as a JSON string.'),
  weeksToProject: z.number().describe('Number of weeks to project into the future.'),
});
export type ProjectFutureRevenueInput = z.infer<typeof ProjectFutureRevenueInputSchema>;

const ProjectFutureRevenueOutputSchema = z.object({
  projectedRevenue: z.string().describe('Projected revenue for the upcoming weeks as a JSON string.'),
  confidenceLevel: z.string().describe('The confidence level of the projection (e.g., High, Medium, Low).'),
  rationale: z.string().describe('Explanation of the factors that were considered in the revenue projection.'),
});
export type ProjectFutureRevenueOutput = z.infer<typeof ProjectFutureRevenueOutputSchema>;

export async function projectFutureRevenue(input: ProjectFutureRevenueInput): Promise<ProjectFutureRevenueOutput> {
  return projectFutureRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectFutureRevenuePrompt',
  input: {schema: ProjectFutureRevenueInputSchema},
  output: {schema: ProjectFutureRevenueOutputSchema},
  prompt: `You are an expert revenue projection analyst for hotels. Given the historical booking data, current booking trends, and the number of weeks to project, project the future revenue.  Explain the factors that were considered in the revenue projection. Also, include a confidence level of the projection (High, Medium, Low).

Historical Booking Data: {{{historicalData}}}
Current Booking Trends: {{{currentTrends}}}
Weeks to Project: {{{weeksToProject}}}

Output the projected revenue as a JSON string, the confidence level, and the rationale.

Ensure that the projectedRevenue is a JSON string.
`,
});

const projectFutureRevenueFlow = ai.defineFlow(
  {
    name: 'projectFutureRevenueFlow',
    inputSchema: ProjectFutureRevenueInputSchema,
    outputSchema: ProjectFutureRevenueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
