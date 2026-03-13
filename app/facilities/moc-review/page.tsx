'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase-client'; // Ensure your Supabase client is set up correctly

export default function FacilitiesMOCReviewPage() {
  const [mocs, setMocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMOCs = async () => {
      try {
        const { data, error } = await supabase
          .from('mocs')
          .select('*')
          .in('status', ['CONTRACTOR_SUBMITTED', 'FACILITIES_CHANGES_REQUESTED']) // Filter by required status
          .order('created_at', { ascending: false }); // Sort by most recent submission

        if (error) {
          throw error; // Handle Supabase error
        }

        console.log('Fetched MOCs:', data); // Debugging fetched data
        setMocs(data); // Set the fetched MOCs
      } catch (error) {
        console.error('Error fetching MOCs:', error);
        setError('An error occurred while fetching the MOCs.');
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchMOCs();
  }, []);

  const filteredMocs = mocs.filter((moc) => {
    const query = searchQuery.toLowerCase();
    return (
      moc.id.toLowerCase().includes(query) ||
      moc.title.toLowerCase().includes(query) ||
      moc.description.toLowerCase().includes(query) ||
      moc.area.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">MOC Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve Management of Change submissions from contractors
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mocs.filter((m) => m.status === 'CONTRACTOR_SUBMITTED').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">New submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Changes Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mocs.filter((m) => m.status === 'FACILITIES_CHANGES_REQUESTED').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting resubmission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mocs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Items requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MOC Submissions</CardTitle>
                <CardDescription>Review contractor-submitted MOC packs</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search MOCs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Loading MOCs...</p>
              </div>
            ) : error ? (
              <div className="flex min-h-[200px] items-center justify-center text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">{error}</p>
              </div>
            ) : filteredMocs.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No MOCs to review</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? 'No MOCs match your search criteria'
                    : 'All MOC submissions have been processed'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMocs.map((moc) => (
                    <TableRow key={moc.id}>
                      <TableCell className="font-medium">{moc.id}</TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium truncate">{moc.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {moc.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="truncate max-w-[150px]">{moc.exactLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            moc.status === 'CONTRACTOR_SUBMITTED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {moc.status === 'CONTRACTOR_SUBMITTED'
                            ? 'New Submission'
                            : 'Changes Requested'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            moc.contractorGate?.submittedAt || moc.created_at
                          ).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/moc/${moc.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}