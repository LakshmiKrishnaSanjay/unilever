'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { workflowStore } from './workflow-store';
import type { WorkflowState } from './types';

export function useWorkflow(): WorkflowState {
  const state = useSyncExternalStore(
    (callback) => workflowStore.subscribe(callback),
    () => workflowStore.getState(),
    () => workflowStore.getState()
  );

  // Always return arrays with safe defaults
  return {
    users: state.users ?? [],
    currentUser: state.currentUser ?? null,
    contractors: state.contractors ?? [],
    stakeholders: state.stakeholders ?? [],
    mocs: state.mocs ?? [],
    ptws: state.ptws ?? [],
    securityLogs: state.securityLogs ?? [],
    activityLog: state.activityLog ?? [],
    contractorDocuments: state.contractorDocuments ?? [],
    notifications: state.notifications ?? [],
  };
}

export function useWorkflowActions() {
  return workflowStore;
}
