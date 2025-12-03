"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrainCircuit } from 'lucide-react';
import { projectFutureRevenue, ProjectFutureRevenueOutput } from '@/ai/flows/project-future-revenue';
import type { Booking } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

interface RevenueProjectionSectionProps {
  allBookings: Booking[];
}

const RevenueProjectionSection = ({ allBookings }: RevenueProjectionSectionProps) => {
  const [weeksToProject, setWeeksToProject] = useState(4);
  const [loading, setLoading] = useState(false);
  const [projection, setProjection] = useState<ProjectFutureRevenueOutput | null>(null);
  const { toast } = useToast();

  const handleProjection = async () => {
    setLoading(true);
    setProjection(null);
    try {
      const historicalData = JSON.stringify(allBookings);
      // For this example, current trends are the same as historical.
      // In a real app, this could be more specific (e.g., last 30 days).
      const currentTrends = JSON.stringify(allBookings.slice(-10));
      
      const result = await projectFutureRevenue({
        historicalData,
        currentTrends,
        weeksToProject,
      });

      setProjection(result);
    } catch (error) {
      console.error("Revenue projection failed:", error);
      toast({
        title: "Projection Failed",
        description: "Could not generate revenue projection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const parsedRevenue = projection?.projectedRevenue ? JSON.parse(projection.projectedRevenue) : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          AI Revenue Projection
        </CardTitle>
        <CardDescription>Project future revenue based on booking trends.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4 mb-6">
          <div className="flex-grow space-y-2">
            <Label htmlFor="weeks">Weeks to Project</Label>
            <Input
              id="weeks"
              type="number"
              value={weeksToProject}
              onChange={(e) => setWeeksToProject(Number(e.target.value))}
              min="1"
              max="52"
            />
          </div>
          <Button onClick={handleProjection} disabled={loading}>
            {loading ? 'Projecting...' : 'Project Revenue'}
          </Button>
        </div>

        {loading && (
            <div className="space-y-4">
                <Skeleton className="w-1/3 h-6" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-24" />
            </div>
        )}

        {projection && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className='flex items-baseline justify-between'>
                <h3 className="text-lg font-semibold">Projection Results</h3>
                <Badge variant={projection.confidenceLevel === 'High' ? 'default' : 'secondary'}>
                    Confidence: {projection.confidenceLevel}
                </Badge>
            </div>
            
            {parsedRevenue && (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Week</TableHead>
                                <TableHead className="text-right">Projected Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(parsedRevenue).map(([week, revenue]) => (
                                <TableRow key={week}>
                                    <TableCell className="font-medium">{week}</TableCell>
                                    <TableCell className="text-right">${Number(revenue).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <div>
                <h4 className="font-semibold">Rationale</h4>
                <p className="mt-1 text-sm text-muted-foreground">{projection.rationale}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueProjectionSection;
