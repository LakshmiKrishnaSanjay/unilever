'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Worker } from '@/lib/types';

interface BadgeCardProps {
  worker: Worker;
  ptwId: string;
  mocId: string;
  location: string;
  validityStart: Date;
  validityEnd: Date;
  contractorCompany?: string;
}

export function BadgeCard({
  worker,
  ptwId,
  mocId,
  location,
  validityStart,
  validityEnd,
  contractorCompany,
}: BadgeCardProps) {
  const badgeId = worker.badge_id || worker.badgeId;
  
  // Generate QR code data - consistent format: badgeId|ptwNo|workerId
  const qrData = `${badgeId || 'PENDING'}|${ptwId}|${worker.badge || worker.name}`;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="w-full max-w-sm border-2 border-primary print:border-black print:break-inside-avoid">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="default" className="text-sm font-bold px-4 py-1">
            GATE PASS
          </Badge>
          <h3 className="text-lg font-bold">Unilever Site Access</h3>
        </div>

        <Separator />

        {/* Worker Details */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Worker Name</p>
            <p className="text-base font-semibold">{worker.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Worker ID</p>
              <p className="text-sm font-medium">{worker.badge || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Role</p>
              <p className="text-sm font-medium">{worker.role || 'Worker'}</p>
            </div>
          </div>

          {badgeId && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Badge ID</p>
              <p className="text-base font-bold text-primary">{badgeId}</p>
            </div>
          )}

          {contractorCompany && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Company</p>
              <p className="text-sm font-medium">{contractorCompany}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Permit Details */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium text-muted-foreground">PTW No:</p>
              <p className="font-semibold">{ptwId}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">MOC No:</p>
              <p className="font-semibold">{mocId}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Location:</p>
            <p className="text-sm font-medium">{location}</p>
          </div>
        </div>

        <Separator />

        {/* Validity Period */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Validity Period</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium">From:</p>
              <p className="font-semibold">
                {formatDate(validityStart)} {formatTime(validityStart)}
              </p>
            </div>
            <div>
              <p className="font-medium">To:</p>
              <p className="font-semibold">
                {formatDate(validityEnd)} {formatTime(validityEnd)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* QR Code */}
        <div className="flex flex-col items-center space-y-2 bg-white p-4 rounded-lg">
          <QRCode
            value={qrData}
            size={128}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <p className="text-xs text-center text-muted-foreground">
            Scan for verification
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            This badge must be worn at all times
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
