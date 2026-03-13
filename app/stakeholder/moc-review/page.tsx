"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Clock, Calendar, CheckCircle } from "lucide-react";
import { useWorkflow } from "@/lib/use-workflow";
import { workflowStore } from "@/lib/workflow-store";

export default function StakeholderMOCReviewPage() {
  const { currentUser, mocs } = useWorkflow();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await workflowStore.syncMOCsFromDatabase();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const myEmail = (currentUser?.email || "").toLowerCase();

  const stakeholderMocs = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return (mocs || [])
      .filter((m: any) => {
        if (m.status !== "PENDING_STAKEHOLDER_APPROVAL") return false;

        const list = Array.isArray(m.stakeholders) ? m.stakeholders : [];
        const assignedToMe = list.some((s: any) => {
          const sEmail = (s?.stakeholder_email || s?.email || "").toLowerCase();
          return sEmail === myEmail && s?.status === "PENDING";
        });

        if (!assignedToMe) return false;

        const title = (m.title || "").toLowerCase();
        const desc = (m.description || "").toLowerCase();
        const area = (m.area || "").toLowerCase();
        const id = (m.id || "").toLowerCase();

        return (
          id.includes(query) ||
          title.includes(query) ||
          desc.includes(query) ||
          area.includes(query)
        );
      })
      .sort((a: any, b: any) => {
        const da = new Date(a.created_at || 0).getTime();
        const db = new Date(b.created_at || 0).getTime();
        return db - da;
      });
  }, [mocs, myEmail, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MOC Sign-off Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review and sign off MOCs assigned to you
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MOC Approvals</CardTitle>
                <CardDescription>MOCs requiring your stakeholder sign-off</CardDescription>
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
            ) : stakeholderMocs.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No MOCs requiring sign-off</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "No MOCs match your search criteria" : "Nothing assigned to you right now"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {stakeholderMocs.map((moc: any) => (
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
                        <div className="text-sm truncate max-w-[150px]">{moc.area}</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending Sign-off
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(moc.created_at).toLocaleDateString()}
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