"use client";

import { useEffect } from "react";
import { DEMO_MODE } from "@/lib/env";
import { seedIfEmpty } from "./seed";

export function DemoBootstrap() {
  useEffect(() => {
    if (DEMO_MODE) seedIfEmpty();
  }, []);
  return null;
}
