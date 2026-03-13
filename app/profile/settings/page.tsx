'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useWorkflow } from '@/lib/use-workflow';
import { supabase } from '@/lib/supabase-client';
import type { UserProfile } from '@/src/types/moc';
import { CheckCircle, Trash2, Pen, ArrowLeft } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { currentUser } = useWorkflow();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const loadSignature = async () => {
      const { data } = await supabase
        .from("user_signatures")
        .select("signature_url")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (data?.signature_url) {
        setSignature(data.signature_url);
      }
    };

    loadSignature();
  }, [currentUser]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;

  const pixel = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  return !pixel.some(v => v !== 0);
};

const saveSignature = async () => {
  if (!canvasRef.current || !currentUser) return;

  const canvas = canvasRef.current;

  const isCanvasBlank = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const pixel = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !pixel.some(v => v !== 0);
  };

  if (isCanvasBlank(canvas)) {
    alert("Please draw your signature first");
    return;
  }

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject("Canvas conversion failed");
      }, "image/png");
    });

    const fileName = `signature-${currentUser.id}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, blob, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    const signatureUrl = supabase
      .storage
      .from("signatures")
      .getPublicUrl(fileName)
      .data.publicUrl;

    const { error: dbError } = await supabase
      .from("user_signatures")
      .upsert({
        user_id: currentUser.id,
        signature_url: signatureUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (dbError) throw dbError;

    setSignature(signatureUrl);
    setSaved(true);

    setTimeout(() => setSaved(false), 3000);

  } catch (err:any) {
    console.error("Signature save error:", err);
    alert(err.message || "Signature save failed");
  }
};

  const handleBackNavigation = () => {
    router.push('/profile');
  };

  const deleteSignature = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete signature?")) return;

    await supabase
      .from("user_signatures")
      .delete()
      .eq("user_id", currentUser.id);

    setSignature(null);
    clearCanvas();
  };


  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and signature for approvals
          </p>
        </div>
        <Button variant="outline" onClick={handleBackNavigation}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* User Info - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your account details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{currentUser?.name || 'Not set'}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{currentUser?.email || 'Not set'}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{currentUser?.role?.replace(/_/g, ' ') || 'Not set'}</p>
          </div>

        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
          <CardDescription>
            Your signature will be used for MOC approvals, PTW sign-offs, and other official documents.
            Draw your signature in the box below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {saved && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950/50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Signature saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Current Signature Preview */}
          {signature && (
            <div className="space-y-3">
              <Label>Current Signature</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <img src={signature || "/placeholder.svg"} alt="Current Signature" className="h-24 border-b border-foreground/20" />
              </div>
              <Button variant="outline" size="sm" onClick={deleteSignature}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Signature
              </Button>
            </div>
          )}

          <Separator />

          {/* Signature Canvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{signature ? 'Update Signature' : 'Draw Your Signature'}</Label>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-1 bg-white dark:bg-gray-900">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <Pen className="inline h-3 w-3 mr-1" />
              Click and drag to draw your signature
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSignature}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Signature
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Label({ children, ...props }: React.ComponentProps<'label'>) {
  return <label className="text-sm font-medium" {...props}>{children}</label>;
}
