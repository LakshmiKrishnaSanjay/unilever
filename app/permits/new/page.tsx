import { Suspense } from "react";
import PermitNewClient from "./permit-new-client";

export default function PermitNewPage() {
  return (
    <Suspense fallback={null}>
      <PermitNewClient />
    </Suspense>
  );
}
