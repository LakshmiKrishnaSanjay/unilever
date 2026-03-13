import { supabase } from './supabase-client';
import type {
  WorkflowState,
  User,
  MOC,
  PTW,
  SecurityLog,
  ActivityLog,
  ContractorDocument,
  Role,
  TimelineEntry,
  StakeholderApproval,
  Worker,
  PermitType,
  ProgressLog,
  PTWStatus,
  MOCGate,
  MOCPackDocument,
  WorkerBadge,
  Notification,
  Contractor,
  Stakeholder,
} from './types';

type Listener = () => void;

const STORAGE_KEY = 'unilever_workflow_state';

// Helper to create consistent dates (avoids hydration issues)
function getBaseDate(offsetDays = 0, offsetHours = 0): Date {
  const base = new Date('2024-01-15T10:00:00Z');
  return new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000 + offsetHours * 60 * 60 * 1000);
}

function createInitialState(): WorkflowState {
  // Demo users
  const baseDate = new Date('2024-01-01T00:00:00Z');
  const users: User[] = [
    {
      id: 'u0',
      username: 'admin',
      name: 'Super Admin',
      email: 'admin@unilever.com',
      role: 'super_admin',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u1',
      username: 'hse',
      name: 'HSE Manager',
      email: 'hse@unilever.com',
      role: 'hse_manager',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u2',
      username: 'stakeholder',
      name: 'Stakeholder User',
      email: 'stakeholder@unilever.com',
      role: 'stakeholder',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u3',
      username: 'facilities',
      name: 'Facilities Manager',
      email: 'facilities@unilever.com',
      role: 'facilities',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u4',
      username: 'efs',
      name: 'EFS Engineer',
      email: 'efs@unilever.com',
      role: 'efs',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u5',
      username: 'security',
      name: 'Security Team',
      email: 'security@unilever.com',
      role: 'security',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u6',
      username: 'supervisor',
      name: 'Unilever Supervisor',
      email: 'supervisor@unilever.com',
      role: 'supervisor',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u7',
      username: 'contractor',
      name: 'ABC Contractors',
      email: 'contractor@abc.com',
      role: 'contractor_admin',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u8',
      username: 'contractor_super',
      name: 'Contractor Supervisor',
      email: 'contractor.super@abc.com',
      role: 'contractor_supervisor',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'u9',
      username: 'viewer',
      name: 'Viewer User',
      email: 'viewer@unilever.com',
      role: 'viewer',
      is_active: true,
      createdAt: baseDate,
    },
  ];

  // Demo contractors
  const contractors: Contractor[] = [
    {
      id: 'c1',
      companyName: 'ABC Contractors Ltd',
      contactName: 'John Smith',
      email: 'contact@abccontractors.com',
      phone: '+1-555-0101',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'c2',
      companyName: 'BuildSafe Construction',
      contactName: 'Sarah Johnson',
      email: 'info@buildsafe.com',
      phone: '+1-555-0202',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 'c3',
      companyName: 'Elite Engineering Services',
      contactName: 'Michael Chen',
      email: 'contact@eliteeng.com',
      phone: '+1-555-0303',
      is_active: false,
      createdAt: baseDate,
    },
  ];

  // Demo stakeholders
  const stakeholders: Stakeholder[] = [
    {
      id: 's1',
      name: 'Production Department',
      department: 'Production',
      email: 'production@unilever.com',
      phone: '+1-555-1001',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 's2',
      name: 'Quality Assurance',
      department: 'Quality',
      email: 'qa@unilever.com',
      phone: '+1-555-1002',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 's3',
      name: 'Maintenance Team',
      department: 'Maintenance',
      email: 'maintenance@unilever.com',
      phone: '+1-555-1003',
      is_active: true,
      createdAt: baseDate,
    },
    {
      id: 's4',
      name: 'Logistics Department',
      department: 'Logistics',
      email: 'logistics@unilever.com',
      phone: '+1-555-1004',
      is_active: true,
      createdAt: baseDate,
    },
  ];

  // Demo MOCs - using fixed dates to avoid hydration errors
  const mocBaseDate = '2024-01-15T10:00:00Z';
  const now = new Date();
  const mocs: MOC[] = [
    {
      id: 'MOC-001',
      title: 'Boiler Room Maintenance',
      purpose: 'Annual maintenance and inspection of boiler systems',
      scope: 'Boiler Room A, Production Area 2',
      description: 'Comprehensive maintenance including pressure testing, valve inspection, and safety system checks',
      contractor_id: 'u7',
      requester_role: 'HSE',
      requester_id: 'u2',
      priority: 'HIGH',
      estimated_cost: 50000,
      startDate: new Date('2024-01-10T00:00:00Z'),
      expiry_date: new Date('2024-02-09T00:00:00Z'),
      attendance_mode: 'DAILY',
      status: 'APPROVED',
      stakeholders: [
        {
          stakeholder_role: 'facilities',
          status: 'APPROVED',
          remarks: 'Approved with safety conditions',
          approved_by: 'Quality Manager',
          approved_at: new Date('2024-01-11T10:00:00Z'),
        },
        {
          stakeholder_role: 'efs',
          status: 'APPROVED',
          remarks: 'Equipment specifications verified',
          approved_by: 'EFS Engineer',
          approved_at: new Date('2024-01-11T10:00:00Z'),
        },
      ],
      timeline: [
        {
          id: 'tl1',
          timestamp: new Date('2024-01-10T09:00:00Z'),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Created MOC',
          status: 'DRAFT',
        },
        {
          id: 'tl2',
          timestamp: new Date('2024-01-10T10:00:00Z'),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Submitted for Stakeholder Review',
          status: 'PENDING_STAKEHOLDER_REVIEW',
        },
        {
          id: 'tl3',
          timestamp: new Date('2024-01-11T10:00:00Z'),
          user: 'Quality Manager',
          role: 'facilities',
          action: 'Approved',
          status: 'APPROVED',
          remarks: 'Approved with safety conditions',
        },
        {
          id: 'tl4',
          timestamp: new Date('2024-01-11T11:00:00Z'),
          user: 'EFS Engineer',
          role: 'efs',
          action: 'Approved',
          status: 'APPROVED',
          remarks: 'Equipment specifications verified',
        },
      ],
      created_at: new Date('2024-01-10T09:00:00Z'),
      updated_at: new Date('2024-01-11T11:00:00Z'),
    },
    {
      id: 'MOC-002',
      title: 'Electrical Panel Upgrade',
      purpose: 'Replace outdated electrical panels with modern switchgear',
      scope: 'Main Electrical Room, Building C',
      description: 'Installation of new 400A panels with improved safety features and remote monitoring',
      contractor_id: 'u7',
      requester_role: 'HSE',
      requester_id: 'u2',
      priority: 'CRITICAL',
      estimated_cost: 120000,
      startDate: new Date('2024-01-13T00:00:00Z'),
      expiry_date: new Date('2024-02-12T00:00:00Z'),
      attendance_mode: 'JOB_WISE',
      status: 'PENDING_STAKEHOLDER_REVIEW',
      stakeholders: [
        {
          stakeholder_role: 'facilities',
          status: 'PENDING',
        },
        {
          stakeholder_role: 'efs',
          status: 'PENDING',
        },
      ],
      timeline: [
        {
          id: 'tl5',
          timestamp: new Date('2024-01-13T09:00:00Z'),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Created MOC',
          status: 'DRAFT',
        },
        {
          id: 'tl6',
          timestamp: new Date('2024-01-13T10:00:00Z'),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Submitted for Stakeholder Review',
          status: 'PENDING_STAKEHOLDER_REVIEW',
        },
      ],
      created_at: new Date('2024-01-13T09:00:00Z'),
      updated_at: new Date('2024-01-13T10:00:00Z'),
    },
    {
      id: 'MOC-003',
      title: 'HVAC System Installation',
      purpose: 'Install new HVAC system in warehouse',
      scope: 'Warehouse Zone 3',
      description: 'Complete HVAC installation including ductwork, units, and controls',
      contractor_id: 'u7',
      requester_role: 'STAKEHOLDER',
      requester_id: 'u6',
      priority: 'MEDIUM',
      estimated_cost: 85000,
      startDate: new Date('2024-01-14T00:00:00Z'),
      expiry_date: new Date('2024-02-13T00:00:00Z'),
      attendance_mode: 'DAILY',
      status: 'PENDING_HSE',
      stakeholders: [],
      timeline: [
        {
          id: 'tl7',
          timestamp: new Date('2024-01-14T09:00:00Z'),
          user: 'Quality Manager',
          role: 'facilities',
          action: 'Created MOC',
          status: 'DRAFT',
        },
        {
          id: 'tl8',
          timestamp: new Date('2024-01-14T10:00:00Z'),
          user: 'Quality Manager',
          role: 'facilities',
          action: 'Submitted for HSE Review',
          status: 'PENDING_HSE',
        },
      ],
      created_at: new Date('2024-01-14T09:00:00Z'),
      updated_at: new Date('2024-01-14T10:00:00Z'),
    },
  ];

  // Demo PTWs
  const ptws: PTW[] = [
    {
      id: 'PTW-001',
      permit_type: 'HOT_WORK',
      title: 'Boiler Welding Repair',
      location: 'Boiler Room A',
      startDatetime: getBaseDate(1, 0),
      end_datetime: getBaseDate(1, 8),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: true,
      requires_efs_review: false,
      requires_stakeholder_closure: false,
      status: 'PENDING_SECURITY_REVIEW',
      revision_number: 1,
      worker_list: [
        { name: 'John Smith', badge: 'W001', role: 'Welder' },
        { name: 'Mike Johnson', badge: 'W002', role: 'Fire Watch' },
      ],
      timeline: [
        {
          id: 'ptl1',
          timestamp: getBaseDate(0, -2),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl2',
          timestamp: getBaseDate(0, -2),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
      ],
      created_at: getBaseDate(0, -2),
      updated_at: getBaseDate(0, -2),
    },
    {
      id: 'PTW-002',
      permit_type: 'WORK_AT_HEIGHT',
      title: 'Roof Inspection',
      location: 'Building C Roof',
      startDatetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: true,
      requires_efs_review: false,
      requires_stakeholder_closure: true,
      status: 'PENDING_FACILITIES_REVIEW',
      revision_number: 1,
      worker_list: [
        { name: 'David Lee', badge: 'W003', role: 'Inspector' },
        { name: 'Sarah Chen', badge: 'W004', role: 'Safety Officer' },
      ],
      timeline: [
        {
          id: 'ptl3',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl4',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl5',
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_FACILITIES_REVIEW',
        },
      ],
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-003',
      permit_type: 'CONFINED_SPACE',
      title: 'Tank Cleaning',
      location: 'Storage Tank 5',
      startDatetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: false,
      requires_efs_review: true,
      requires_stakeholder_closure: false,
      status: 'PENDING_EFS_REVIEW',
      revision_number: 1,
      worker_list: [
        { name: 'Tom Wilson', badge: 'W005', role: 'Technician' },
        { name: 'Emma Brown', badge: 'W006', role: 'Standby Person' },
      ],
      timeline: [
        {
          id: 'ptl6',
          timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl7',
          timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl8',
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_EFS_REVIEW',
        },
      ],
      created_at: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-004',
      permit_type: 'EXCAVATION',
      title: 'Underground Cable Installation',
      location: 'Site Entrance',
      startDatetime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: true,
      requires_efs_review: true,
      requires_stakeholder_closure: true,
      status: 'PENDING_HSE_APPROVAL',
      revision_number: 1,
      worker_list: [
        { name: 'Chris Taylor', badge: 'W007', role: 'Excavator Operator' },
        { name: 'Lisa Davis', badge: 'W008', role: 'Spotter' },
      ],
      timeline: [
        {
          id: 'ptl9',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl10',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl11',
          timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_FACILITIES_REVIEW',
        },
        {
          id: 'ptl12',
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          user: 'Quality Manager',
          role: 'facilities',
          action: 'Approved',
          status: 'PENDING_EFS_REVIEW',
        },
        {
          id: 'ptl13',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          user: 'EFS Engineer',
          role: 'efs',
          action: 'Approved',
          status: 'PENDING_HSE_APPROVAL',
        },
      ],
      created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-005',
      permit_type: 'ELECTRICAL_ISOLATION',
      title: 'Panel Replacement',
      location: 'Electrical Room B',
      startDatetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: false,
      requires_efs_review: true,
      requires_stakeholder_closure: false,
      status: 'REJECTED',
      revision_number: 1,
      sent_back_to_role: 'contractor_admin',
      sent_back_reason: 'Missing isolation procedure details and lock/tag numbers',
      worker_list: [
        { name: 'Robert Martinez', badge: 'W009', role: 'Electrician' },
      ],
      timeline: [
        {
          id: 'ptl14',
          timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl15',
          timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl16',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Sent Back to Contractor',
          status: 'REJECTED',
          remarks: 'Missing isolation procedure details and lock/tag numbers',
        },
      ],
      created_at: new Date(now.getTime() - 14 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-006',
      permit_type: 'MASTER',
      title: 'General Maintenance Work',
      location: 'Production Area 2',
      startDatetime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: false,
      requires_efs_review: false,
      requires_stakeholder_closure: false,
      status: 'ACTIVE',
      revision_number: 1,
      worker_list: [
        { name: 'Alex Johnson', badge: 'W010', role: 'Technician' },
        { name: 'Nina Patel', badge: 'W011', role: 'Helper' },
      ],
      timeline: [
        {
          id: 'ptl17',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl18',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl19',
          timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_HSE_APPROVAL',
        },
        {
          id: 'ptl20',
          timestamp: new Date(now.getTime() - 16 * 60 * 60 * 1000),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Approved',
          status: 'READY_TO_START',
        },
        {
          id: 'ptl21',
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Checked In',
          status: 'ACTIVE',
        },
      ],
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-007',
      permit_type: 'PIPEWORK_ISOLATION',
      title: 'Valve Replacement',
      location: 'Process Line 3',
      startDatetime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() - 16 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: false,
      requires_efs_review: true,
      status: 'WORK_FINISHED',
      revision_number: 1,
      worker_list: [
        { name: 'Frank Harris', badge: 'W012', role: 'Pipe Fitter' },
      ],
      timeline: [
        {
          id: 'ptl22',
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl23',
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl24',
          timestamp: new Date(now.getTime() - 32 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_EFS_REVIEW',
        },
        {
          id: 'ptl25',
          timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000),
          user: 'EFS Engineer',
          role: 'efs',
          action: 'Approved',
          status: 'PENDING_HSE_APPROVAL',
        },
        {
          id: 'ptl26',
          timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Approved',
          status: 'READY_TO_START',
        },
        {
          id: 'ptl27',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Checked In',
          status: 'ACTIVE',
        },
        {
          id: 'ptl28',
          timestamp: new Date(now.getTime() - 17 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Marked Work Completed',
          status: 'WORK_COMPLETED',
        },
        {
          id: 'ptl29',
          timestamp: new Date(now.getTime() - 16 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Verified and Checked Out',
          status: 'WORK_FINISHED',
        },
      ],
      created_at: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    },
    {
      id: 'PTW-008',
      permit_type: 'HOT_WORK',
      title: 'Welding and Fabrication Work',
      location: 'Workshop Area',
      startDatetime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      moc_id: 'MOC-001',
      contractor_id: 'u7',
      requires_facilities_review: false,
      requires_efs_review: false,
      requires_stakeholder_closure: false,
      status: 'READY_FOR_ENTRY',
      revision_number: 1,
      worker_list: [
        { 
          name: 'James Wilson', 
          badge: 'W013', 
          role: 'Welder',
          badgeId: 'UNI-BDG-PTW-008-01',
          badge_id: 'UNI-BDG-PTW-008-01',
          entryStatus: 'PENDING',
          entryChecklist: [
            { id: 'ptw-area', label: 'Valid PTW & correct area', required: true, checked: false },
            { id: 'ppe', label: 'PPE checked', required: true, checked: false },
            { id: 'tools', label: 'Tools/Equipment checked', required: true, checked: false },
            { id: 'induction', label: 'Site induction confirmed', required: true, checked: false },
            { id: 'briefing', label: 'Emergency briefing confirmed', required: true, checked: false },
          ],
        },
        { 
          name: 'Maria Garcia', 
          badge: 'W014', 
          role: 'Fire Watch',
          badgeId: 'UNI-BDG-PTW-008-02',
          badge_id: 'UNI-BDG-PTW-008-02',
          entryStatus: 'PENDING',
          entryChecklist: [
            { id: 'ptw-area', label: 'Valid PTW & correct area', required: true, checked: false },
            { id: 'ppe', label: 'PPE checked', required: true, checked: false },
            { id: 'tools', label: 'Tools/Equipment checked', required: true, checked: false },
            { id: 'induction', label: 'Site induction confirmed', required: true, checked: false },
            { id: 'briefing', label: 'Emergency briefing confirmed', required: true, checked: false },
          ],
        },
        { 
          name: 'Kevin Chen', 
          badge: 'W015', 
          role: 'Helper',
          badgeId: 'UNI-BDG-PTW-008-03',
          badge_id: 'UNI-BDG-PTW-008-03',
          entryStatus: 'PENDING',
          entryChecklist: [
            { id: 'ptw-area', label: 'Valid PTW & correct area', required: true, checked: false },
            { id: 'ppe', label: 'PPE checked', required: true, checked: false },
            { id: 'tools', label: 'Tools/Equipment checked', required: true, checked: false },
            { id: 'induction', label: 'Site induction confirmed', required: true, checked: false },
            { id: 'briefing', label: 'Emergency briefing confirmed', required: true, checked: false },
          ],
        },
      ],
      entryProgress: { passed: 0, total: 3 },
      entryLogs: [
        {
          at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          by: 'HSE Manager',
          action: 'READY_FOR_ENTRY_INIT',
        },
      ],
      timeline: [
        {
          id: 'ptl30',
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Created PTW',
          status: 'DRAFT',
        },
        {
          id: 'ptl31',
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          user: 'ABC Contractors',
          role: 'contractor_admin',
          action: 'Submitted for Review',
          status: 'PENDING_SECURITY_REVIEW',
        },
        {
          id: 'ptl32',
          timestamp: new Date(now.getTime() - 40 * 60 * 60 * 1000),
          user: 'Security Team',
          role: 'security',
          action: 'Approved',
          status: 'PENDING_HSE_APPROVAL',
        },
        {
          id: 'ptl33',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          user: 'HSE Manager',
          role: 'hse_manager',
          action: 'Approved by HSE - Ready for Entry',
          status: 'READY_FOR_ENTRY',
          remarks: 'Badge IDs generated for all workers',
        },
      ],
      created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  ];

  const securityLogs: SecurityLog[] = [
    {
      ptw_id: 'PTW-006',
      check_in_time: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      check_in_checklist: {
        all_workers_present: true,
        ppe_verified: true,
        tools_inspected: true,
        area_barricaded: true,
        permits_reviewed: true,
      },
      progress_logs: [
        {
          id: 'pl1',
          timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          user: 'Security Team',
          remarks: 'Work proceeding as planned. All safety measures in place.',
        },
        {
          id: 'pl2',
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          user: 'Security Team',
          remarks: 'Mid-work inspection completed. No issues observed.',
        },
      ],
    },
    {
      ptw_id: 'PTW-007',
      check_in_time: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      check_in_checklist: {
        all_workers_present: true,
        ppe_verified: true,
        tools_inspected: true,
        area_barricaded: true,
        permits_reviewed: true,
      },
      progress_logs: [
        {
          id: 'pl3',
          timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000),
          user: 'Security Team',
          remarks: 'Isolation verified. Work started.',
        },
        {
          id: 'pl4',
          timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000),
          user: 'Security Team',
          remarks: 'Work in progress. Safety protocols followed.',
        },
      ],
      check_out_time: new Date(now.getTime() - 16 * 60 * 60 * 1000),
      check_out_verified_by: 'Security Team',
    },
  ];

  const activityLog: ActivityLog[] = [];
  const contractorDocuments: ContractorDocument[] = [
    {
      id: 'doc1',
      contractor_id: 'u7',
      folder: 'Insurance',
      file_name: 'liability_insurance_2024.pdf',
      uploaded_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      reviewed_by: 'HSE Manager',
      reviewed_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      remarks: 'Valid until Dec 2024',
    },
    {
      id: 'doc2',
      contractor_id: 'u7',
      folder: 'Certifications',
      file_name: 'iso_9001_certificate.pdf',
      uploaded_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      id: 'doc3',
      contractor_id: 'u7',
      folder: 'Safety Records',
      file_name: 'safety_training_2024.pdf',
      uploaded_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  ];

  const notifications: Notification[] = [];

  return {
    users,
    currentUser: null,
    contractors,
    stakeholders,
    mocs,
    ptws,
    securityLogs,
    activityLog,
    contractorDocuments,
    notifications,
  };
}

class WorkflowStore {
  private state: WorkflowState;
  private listeners: Set<Listener> = new Set();

constructor() {
  this.state = this.loadState();

  if (typeof window !== "undefined") {
    setTimeout(() => {
      this.syncFromDatabase();
    }, 0);
  }
}


async syncFromDatabase() {
  try {
    const results = await Promise.allSettled([
      supabase.from("users").select("*"),
      supabase.from("ptws").select("*"),
      supabase.from("contractors").select("*"),
      supabase.from("stakeholders").select("*"),
      supabase.from("mocs").select("*").order("created_at", { ascending: false }), // ✅ add
      supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }),
    ]);

    const [usersRes, ptwRes, contractorRes, stakeholderRes, mocsRes, activityRes] = results;

    // users
    if (usersRes.status === "fulfilled") {
      if (usersRes.value.error) console.error("Sync users failed:", usersRes.value.error);
      else this.state.users = usersRes.value.data || [];
    } else console.error("Sync users crashed:", usersRes.reason);

    // ptws
    if (ptwRes.status === "fulfilled") {
      if (ptwRes.value.error) console.error("Sync ptws failed:", ptwRes.value.error);
      else this.state.ptws = ptwRes.value.data || [];
    } else console.error("Sync ptws crashed:", ptwRes.reason);

    // contractors
    if (contractorRes.status === "fulfilled") {
      if (contractorRes.value.error) console.error("Sync contractors failed:", contractorRes.value.error);
      else this.state.contractors = contractorRes.value.data || [];
    } else console.error("Sync contractors crashed:", contractorRes.reason);

    // stakeholders
    if (stakeholderRes.status === "fulfilled") {
      if (stakeholderRes.value.error) console.error("Sync stakeholders failed:", stakeholderRes.value.error);
      else this.state.stakeholders = stakeholderRes.value.data || [];
    } else console.error("Sync stakeholders crashed:", stakeholderRes.reason);

    // ✅ mocs
    if (mocsRes?.status === "fulfilled") {
      if (mocsRes.value.error) console.error("Sync mocs failed:", mocsRes.value.error);
      else this.state.mocs = mocsRes.value.data || [];
    } else if (mocsRes) {
      console.error("Sync mocs crashed:", (mocsRes as any).reason);
    }

    // activity logs
if (activityRes.status === "fulfilled") {
  if (activityRes.value.error) {
    console.error("Sync activity logs failed:", activityRes.value.error);
  } else {
    this.state.activityLog = activityRes.value.data || [];
  }
} else {
  console.error("Sync activity logs crashed:", activityRes.reason);
}

    await this.saveState();
    this.notify();
  } catch (e: any) {
    console.error("Failed to sync from database:", e?.message || e);
  }
}

private loadState(): WorkflowState {
  const defaultState = createInitialState();

  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      this.deserializeDates(parsed);

      return {
        ...defaultState,
        ...parsed,
        users: parsed.users ?? defaultState.users,
        contractors: parsed.contractors ?? defaultState.contractors,
        stakeholders: parsed.stakeholders ?? defaultState.stakeholders,
        mocs: parsed.mocs ?? defaultState.mocs,
        ptws: parsed.ptws ?? defaultState.ptws,
        securityLogs: parsed.securityLogs ?? defaultState.securityLogs,
        activityLog: parsed.activityLog ?? defaultState.activityLog,
        contractorDocuments: parsed.contractorDocuments ?? defaultState.contractorDocuments,
        notifications: parsed.notifications ?? defaultState.notifications,
      };
    }
  } catch (error) {
    console.error("Failed to load local cache state:", error);
  }

  return defaultState;
}

private deserializeDates(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      obj[key] = new Date(value);
    } 
    else if (typeof value === 'object') {
      this.deserializeDates(value);
    }
  }
}

private async saveState(): Promise<void> {
  try {
    const { error } = await supabase
      .from("workflow_state")
      .upsert({
        id: "main",
        data: this.state,
        updated_at: new Date()
      });

    if (error) {
      console.error("Failed to save state to Supabase:", error);
    }

    // Optional cache (not mandatory but keeps UI fast)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

private notify(): void {
  queueMicrotask(() => {
    this.listeners.forEach((listener) => listener());
  });
}

subscribe(listener: Listener): () => void {
  this.listeners.add(listener);

  // Immediately sync state to listener (important for SSR hydration + DB load)
  queueMicrotask(() => listener());

  return () => this.listeners.delete(listener);
}

getState(): WorkflowState {
  return this.state; // ✅ return same reference
}

  // Auth actions
async login(email: string, password: string): Promise<{ role: Role }> {
  // 1️⃣ Sign in using Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Invalid email or password");
  }

  const authUser = authData.user;

  // 2️⃣ Fetch user profile from public.users
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  if (userError || !userRow) {
    // Sign out if profile missing
    await supabase.auth.signOut();
    throw new Error("Authenticated but no matching user profile found.");
  }

  // 3️⃣ 🚫 Check if account is active
  if (!userRow.is_active) {
    // Immediately sign out the session
    await supabase.auth.signOut();

    throw new Error("Your account is inactive. Please contact administrator.");
  }

  // 4️⃣ Save in state
  this.state.currentUser = userRow;

  await this.addActivityLog({
    user: userRow.name,
    role: userRow.role,
    module: "SYSTEM",
    action: "Logged in",
    details: `${userRow.name} logged in`,
  });

  this.saveState();
  this.notify();

  return { role: userRow.role as Role };
}

async logout(): Promise<void> {
  try {
    const user = this.state.currentUser;

    if (user) {
      await this.addActivityLog({
        user: user.name,
        role: user.role,
        module: "SYSTEM",
        action: "Logged out",
        details: `${user.name} logged out`,
      });
    }

    // 🔐 IMPORTANT: destroy Supabase Auth session
    await supabase.auth.signOut();

    // Clear local state
    this.state.currentUser = null;

    this.saveState();
    this.notify();
  } catch (err) {
    console.error("Logout error:", err);
  }
}

async updateUserProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!this.state.currentUser) {
      return { success: false, error: "No current user" };
    }

    const userId = this.state.currentUser.id;

    // ✅ Update database first (Important)
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Profile DB update error:", error);
      return { success: false, error: error.message };
    }

    if (data) {
      // ✅ Update store state
      const userIndex = this.state.users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        this.state.users[userIndex] = data;
      }

      this.state.currentUser = data;

      // ✅ Activity log
      this.addActivityLog({
        user: data.name,
        role: data.role,
        module: "SYSTEM",
        action: "Updated profile",
        details: "Profile information updated",
      });

      this.saveState();
      this.notify();
    }

    return { success: true };

  } catch (err: any) {
    console.error("updateUserProfile error:", err);
    return { success: false, error: err.message };
  }
}

  // MOC actions
async createMOC(
  moc: {
    title: string;
    area?: string | null;
    exactLocation?: string | null;
    description?: string | null;
    reasonForChange?: string | null;
    riskSummary?: string | null;

    contractorCompany?: string | null;
    contractor_id?: string | null;

    startDate?: string | null;
    endDate?: string | null;
    requiresStakeholderApproval?: boolean;

    stakeholders?: any[];
    before_images?: any[];
    after_images?: any[];

    status?: string | null;
    scope?: string | null;
    priority?: string | null;
    estimated_cost?: number | null;
    attendance_mode?: string | null;
  }
): Promise<{ success: boolean; error?: string; id?: string }> {

  try {

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const now = new Date().toISOString();

    const insertBody = {

      title: moc.title,

      area: moc.area ?? null,
      "exactLocation": moc.exactLocation ?? null,
      description: moc.description ?? null,
      "reasonForChange": moc.reasonForChange ?? null,
      "riskSummary": moc.riskSummary ?? null,

      scope: moc.scope ?? null,
      priority: moc.priority ?? null,
      estimated_cost: moc.estimated_cost ?? null,
      attendance_mode: moc.attendance_mode ?? null,

      start_date: moc.startDate ?? null,
      expiry_date: moc.endDate ?? null,

      "requiresStakeholderApproval": moc.requiresStakeholderApproval ?? false,

      "contractorCompany": moc.contractorCompany ?? null,
      contractor_id: moc.contractor_id ?? null,

      requester_role: this.state.currentUser?.role ?? null,
      requester_id: this.state.currentUser?.id ?? null,

      status: moc.status ?? "SUBMITTED",

      stakeholders: moc.stakeholders ?? [],
      before_images: moc.before_images ?? [],
      after_images: moc.after_images ?? [],

      created_at: now,
      updated_at: now,
    };

    const res = await fetch("/api/admin/mocs/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(insertBody),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.error || "Database insert failed" };
    }

    await this.syncMOCs();

    return { success: true, id: json?.id };

  } catch (err: any) {

    console.error("createMOC failed:", err);

    return {
      success: false,
      error: err?.message || "Database insert failed"
    };

  }
}

async syncMOCs() {
  try {

    const { data } = await supabase
      .from("mocs")
      .select("*")
      .order("created_at", { ascending: false });

    this.state.mocs = data || [];
    this.saveState();
    this.notify();

  } catch (err) {
    console.error("MOC sync failed", err);
  }
}


async syncMOCsFromDatabase() {
  try {
    const { data, error } = await supabase
      .from("mocs")
      .select(`
        *,
        contractors:contractorCompany (
          companyName
        )
      `)
      .order("created_at", { ascending: false });

    // Handle any Supabase errors
    if (error) {
      console.error("Error fetching MOCs:", error);
      throw error;
    }

    // Log data for debugging
    console.log("Fetched MOCs:", data);

    // Ensure you are correctly updating your state in a functional component
    this.state.mocs = data || [];  // For class components
    this.notify();  // Call your notify method after data is fetched

    // In a functional component, you should use setState instead of directly manipulating this.state
    // Example: setMocs(data || []); if using useState in a functional component.

  } catch (e) {
    console.error("MOC sync failed", e);
  }
}

async getMOCById(id: string) {
  try {
    const { data, error } = await supabase
      .from("mocs")
      .select(`
        *,
        moc_gates(
          *,
          acknowledged_user:acknowledged_by(
            id,
            name,
            contractor_id,
            contractor:contractor_id(
              companyName
            )
          ),
          moc_pack_documents(*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("getMOCById query error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    const gate = data?.moc_gates?.[0];
    const documents = gate?.moc_pack_documents || [];

    let contractorSignature: string | null = null;

if (gate?.acknowledged_by) {
  const { data: signatureRow } = await supabase
    .from('user_signatures')
    .select('signature_url')
    .eq('user_id', gate.acknowledged_by)
    .single();

  contractorSignature = signatureRow?.signature_url || null;
}

    console.log("RAW GATE:", gate);
    console.log("ACK USER:", gate?.acknowledged_user);
    console.log("ACK CONTRACTOR:", gate?.acknowledged_user?.contractor);

    const mappedData = {
      ...data,
      facilitiesApproval: data.facilities_approval ?? null,
      contractorGate: gate
        ? {
            id: gate.id,
            acknowledged: gate.acknowledged,
            acknowledgedAt: gate.acknowledged_at,
            acknowledgedBy:
              gate?.acknowledged_user?.contractor?.companyName ||
              gate?.acknowledged_user?.name ||
              gate?.acknowledged_by,
            submittedAt: gate.acknowledged_at,
            supervisorName: gate.supervisor_name,
            signature: contractorSignature,
            supervisorPhone: gate.supervisor_phone,
            supervisorEmail: gate.supervisor_email,
            supervisorIdPassport: gate.supervisor_id,
            documents: {
              companyCertificates:
                documents.find((d: any) => d.type === "company_certificate")?.file_name || "",
              methodStatement:
                documents.find((d: any) => d.type === "method_statement")?.file_name || "",
              riskAssessment:
                documents.find((d: any) => d.type === "risk_assessment")?.file_name || "",
              projectPlan:
                documents.find((d: any) => d.type === "project_plan")?.file_name || "",
            },
          }
        : null,
    };

    return mappedData;
  } catch (e: any) {
    console.error("Get MOC by id failed", {
      message: e?.message,
      details: e?.details,
      hint: e?.hint,
      code: e?.code,
      full: e,
    });
    return null;
  }
}


async updateMOC(id: string, updates: Partial<MOC>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date()
    };

    // ✅ Update database first
    const { data, error } = await supabase
      .from("mocs")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("MOC update DB error:", error);
      return { success: false, error: error.message };
    }

    if (data) {
      // ✅ Update local store state
      const index = this.state.mocs.findIndex(m => m.id === id);

      if (index !== -1) {
        this.state.mocs[index] = data;
      }

      this.saveState();
      this.notify();
    }

    return { success: true };

  } catch (err: any) {
    console.error("updateMOC error:", err);
    return { success: false, error: err.message };
  }
}

async submitMOCForReview(
  id: string
): Promise<{ success: boolean; error?: string }> {

  try {

    const moc = this.state.mocs.find((m) => m.id === id);

    if (!moc) {
      return { success: false, error: "MOC not found" };
    }

    // check boolean + stakeholders
    const requiresStakeholderApproval = moc.requiresStakeholderApproval === true;

    const hasStakeholders =
      Array.isArray(moc.stakeholders) &&
      moc.stakeholders.length > 0;

    let newStatus: string;

    if (requiresStakeholderApproval && hasStakeholders) {
      newStatus = "PENDING_STAKEHOLDER_APPROVAL";
    } else {
      newStatus = "PENDING_FACILITY_APPROVAL";
    }

    const { data, error } = await supabase
      .from("mocs")
      .update({
        status: newStatus,
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("submitMOCForReview DB error:", error);
      return { success: false, error: error.message };
    }

    if (data) {

      const index = this.state.mocs.findIndex(m => m.id === id);

      if (index !== -1) {
        this.state.mocs[index] = data;
      }

      this.saveState();
      this.notify();
    }

    return { success: true };

  } catch (err: any) {

    console.error("submitMOCForReview error:", err);

    return {
      success: false,
      error: err.message
    };

  }
}

async approveMOCStakeholder(
  id: string,
  stakeholderId: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {

  try {

    const moc = this.state.mocs.find((m) => m.id === id);
    if (!moc) {
      return { success: false, error: "MOC not found" };
    }

    const stakeholders = moc.stakeholders.map((s) =>
      s.stakeholder_id === stakeholderId
        ? {
            ...s,
            status: "APPROVED",
            remarks,
            approved_by: this.state.currentUser?.name,
            approved_at: new Date()
          }
        : s
    );

    const allApproved = stakeholders.every(s => s.status === "APPROVED");

    const newStatus = allApproved
      ? "PENDING_FACILITY_APPROVAL"
      : moc.status;

    const { data, error } = await supabase
      .from("mocs")
      .update({
        stakeholders,
        status: newStatus,
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const index = this.state.mocs.findIndex(m => m.id === id);

    if (index !== -1) {
      this.state.mocs[index] = data;
    }

    this.saveState();
    this.notify();

    return { success: true };

  } catch (err: any) {

    console.error("approveMOCStakeholder error:", err);

    return {
      success: false,
      error: err.message
    };

  }
}

async rejectMOCStakeholder(
  id: string,
  stakeholderId: string,
  remarks: string
): Promise<{ success: boolean; error?: string }> {

  try {

    const moc = this.state.mocs.find((m) => m.id === id);

    if (!moc) {
      return { success: false, error: "MOC not found" };
    }

    const stakeholders = moc.stakeholders.map((s) =>
      s.stakeholder_id === stakeholderId
        ? {
            ...s,
            status: "REJECTED",
            remarks,
            approved_by: this.state.currentUser?.name,
            approved_at: new Date()
          }
        : s
    );

    const { data, error } = await supabase
      .from("mocs")
      .update({
        stakeholders,
        status: "REJECTED",
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const index = this.state.mocs.findIndex(m => m.id === id);

    if (index !== -1) {
      this.state.mocs[index] = data;
    }

    this.saveState();
    this.notify();

    return { success: true };

  } catch (err: any) {

    console.error("rejectMOCStakeholder error:", err);

    return {
      success: false,
      error: err.message
    };

  }
}

async approveMOCByHSE(
  id: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const moc = this.state.mocs.find(m => m.id === id);
    if (!moc) {
      return { success: false, error: "MOC not found" };
    }

    const timelineEntry = {
      id: `tl-${Date.now()}`,
      timestamp: new Date(),
      user: this.state.currentUser?.name || "System",
      role: this.state.currentUser?.role || "hse_manager",
      action: "Approved by HSE",
      status: "APPROVED",
      remarks,
    };

    const updatedTimeline = [...(moc.timeline || []), timelineEntry];

    // ✅ Database update first (CRITICAL)
    const { data, error } = await supabase
      .from("mocs")
      .update({
        status: "APPROVED",
        timeline: updatedTimeline,
        updated_at: new Date(),
        hse_approved_at: new Date(),
        hse_approved_by: this.state.currentUser?.name
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("HSE approval DB error:", error);
      return { success: false, error: error.message };
    }

    if (data) {
      const index = this.state.mocs.findIndex(m => m.id === id);
      if (index !== -1) {
        this.state.mocs[index] = data;
      }

      this.addActivityLog({
        user: this.state.currentUser?.name || "System",
        role: this.state.currentUser?.role || "hse_manager",
        module: "MOC",
        action: "Approved by HSE",
        status: "APPROVED",
        details: `MOC ${id} approved by HSE`
      });

      this.saveState();
      this.notify();
    }

    return { success: true };

  } catch (err: any) {
    console.error("approveMOCByHSE error:", err);
    return { success: false, error: err.message };
  }
}

async rejectMOCByHSE(
  id: string,
  remarks: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const moc = this.state.mocs.find(m => m.id === id);
    if (!moc) {
      return { success: false, error: "MOC not found" };
    }

    const timelineEntry = {
      id: `tl-${Date.now()}`,
      timestamp: new Date(),
      user: this.state.currentUser?.name || "System",
      role: this.state.currentUser?.role || "hse_manager",
      action: "Rejected by HSE",
      status: "REJECTED",
      remarks,
    };

    const updatedTimeline = [...(moc.timeline || []), timelineEntry];

    // ✅ Database update first (CRITICAL)
    const { data, error } = await supabase
      .from("mocs")
      .update({
        status: "REJECTED",
        timeline: updatedTimeline,
        updated_at: new Date(),
        hse_rejected_at: new Date(),
        hse_rejected_by: this.state.currentUser?.name,
        hse_rejection_reason: remarks
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("HSE rejection DB error:", error);
      return { success: false, error: error.message };
    }

    if (data) {
      const index = this.state.mocs.findIndex(m => m.id === id);
      if (index !== -1) {
        this.state.mocs[index] = data;
      }

      this.addActivityLog({
        user: this.state.currentUser?.name || "System",
        role: this.state.currentUser?.role || "hse_manager",
        module: "MOC",
        action: "Rejected by HSE",
        status: "REJECTED",
        details: `MOC ${id} rejected by HSE: ${remarks}`,
      });

      this.saveState();
      this.notify();
    }

    return { success: true };

  } catch (err: any) {
    console.error("rejectMOCByHSE error:", err);
    return { success: false, error: err.message };
  }
}

private async addMOCTimelineEntry(
  mocId: string,
  action: string,
  status: string,
  remarks?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("moc_timeline")
      .insert({
        moc_id: mocId,
        user_id: this.state.currentUser?.id || null,
        action,
        status,
        remarks,
      });

    if (error) {
      console.error("Timeline insert error:", error);
    }

  } catch (err) {
    console.error("addMOCTimelineEntry error:", err);
  }
}

async acknowledgeMOC(
  mocId: string,
  signatureName: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // 1️⃣ Create moc_gate row
const { data: gate, error: gateError } = await supabase
  .from("moc_gates")
  .insert({
    moc_id: mocId,
    acknowledged: true,
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: this.state.currentUser?.id,
    contractor_id: this.state.currentUser?.id,
    moc_pack_status: "PENDING",
    supervisor_name: supervisorName,
    supervisor_phone: supervisorPhone,
    supervisor_email: supervisorEmail,
    supervisor_id: supervisorId,
  })
  .select()
  .single();

if (gateError || !gate) {
  return { success: false, error: gateError?.message };
}

    // 2️⃣ Insert default documents
    await supabase.from("moc_pack_documents").insert([
      { moc_gate_id: gate.id, type: "company_certificate" },
      { moc_gate_id: gate.id, type: "supervisor_details" },
      { moc_gate_id: gate.id, type: "method_statement" },
      { moc_gate_id: gate.id, type: "risk_assessment" },
      { moc_gate_id: gate.id, type: "project_plan" },
    ]);

    // 3️⃣ Add timeline entry
    await this.addMOCTimelineEntry(
      mocId,
      `MOC Gate completed by ${signatureName}`,
      "GATE_COMPLETED",
      "Contractor acknowledged MOC"
    );

    return { success: true };

  } catch (err: any) {
    console.error("acknowledgeMOC error:", err);
    return { success: false, error: err.message };
  }
}

async submitMOCPack(
  mocId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // 1️⃣ Update gate status
    const { error } = await supabase
      .from("moc_gates")
      .update({
        moc_pack_status: "SUBMITTED"
      })
      .eq("moc_id", mocId);

    if (error) {
      return { success: false, error: error.message };
    }

    // 2️⃣ CALL WORKFLOW FUNCTION
    await supabase.rpc("update_moc_workflow", {
      p_moc_id: mocId,
      p_action: "CONTRACTOR_SUBMIT"
    });

    // 3️⃣ Add timeline entry
    await this.addMOCTimelineEntry(
      mocId,
      "MOC Pack submitted",
      "CONTRACTOR_SUBMITTED"
    );

    return { success: true };

  } catch (err: any) {
    console.error("submitMOCPack error:", err);
    return { success: false, error: err.message };
  }
}

async createPTW(
  ptw: Omit<PTW, "id" | "created_at" | "updated_at" | "timeline" | "revision_number">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const res = await fetch("/api/admin/permit/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ptw),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.error || "Create PTW failed" };
    }

    const id = json?.id as string | undefined;
    if (!id) {
      return { success: false, error: "No PTW id returned" };
    }

    this.saveState?.();
    this.notify?.();

    return { success: true, id };
  } catch (err: any) {
    console.error("createPTW error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}


async updatePTW(
  id: string,
  updates: Partial<PTW>
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    console.log("Data being sent to DB:", payload);

    const { data, error } = await supabase
      .from("ptws")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("PTW update DB error:", error.message);
      return { success: false, error: error.message };
    }

    if (data) {
      console.log("Updated PTW data from DB:", data);

      const index = this.state.ptws.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.state.ptws[index] = data as PTW;
      }

      this.saveState?.();
      this.notify?.();
    }

    return { success: true };
  } catch (err: any) {
    console.error("updatePTW error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}


async submitPTW(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch(`/api/admin/permit/${id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.error || "Submit failed" };

    await this.syncFromDatabase();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Submit failed" };
  }
}

async clearPTWDraft(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch(`/api/admin/permit/draft/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.error || "Delete draft failed" };

    await this.syncFromDatabase();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Delete draft failed" };
  }
}

async savePTWDraft(
  payload: any // or a proper type
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/admin/permit/draft", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // include id if exists
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.error || "Save draft failed" };

    await this.syncFromDatabase();
    return { success: true, id: json?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Save draft failed" };
  }
}

async approvePTWSecurity(id: string): Promise<{ success: boolean; error?: string }> {
  try {

    const ptw = this.state.ptws.find((p) => p.id === id);
    if (!ptw) {
      return { success: false, error: "PTW not found" };
    }

    let nextStatus: PTWStatus;

    if (ptw.requires_facilities_review) {
      nextStatus = 'PENDING_FACILITIES_REVIEW';
    } else if (ptw.requires_efs_review) {
      nextStatus = 'PENDING_EFS_REVIEW';
    } else {
      nextStatus = 'PENDING_HSE_APPROVAL';
    }

    // ✅ Update workflow state in DB + memory
    const result = await this.updatePTW(id, { status: nextStatus });
    if (!result.success) return result;

    await this.addPTWTimelineEntry(
      id,
      'Approved by Security',
      nextStatus
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || 'System',
      role: 'security',
      module: 'PTW',
      action: 'Approved by Security',
      status: nextStatus,
      details: `PTW ${id} approved by security`,
    });

    return { success: true };

  } catch (error: any) {
    console.error("approvePTWSecurity error:", error);
    return { success: false, error: error.message };
  }
}

async approvePTWQuality(id: string): Promise<{ success: boolean; error?: string }> {
  try {

    const ptw = this.state.ptws.find((p) => p.id === id);
    if (!ptw) {
      return { success: false, error: "PTW not found" };
    }

    const nextStatus = ptw.requires_efs_review
      ? 'PENDING_EFS_REVIEW'
      : 'PENDING_HSE_APPROVAL';

    const result = await this.updatePTW(id, { status: nextStatus });
    if (!result.success) return result;

    await this.addPTWTimelineEntry(id, 'Approved by Quality', nextStatus);

    this.addActivityLog({
      user: this.state.currentUser?.name || 'System',
      role: 'facilities',
      module: 'PTW',
      action: 'Approved by Quality',
      status: nextStatus,
      details: `PTW ${id} approved by quality`,
    });

    return { success: true };

  } catch (error: any) {
    console.error("approvePTWQuality error:", error);
    return { success: false, error: error.message };
  }
}

async approvePTWEFS(id: string): Promise<{ success: boolean; error?: string }> {
  try {

    const ptw = this.state.ptws.find((p) => p.id === id);
    if (!ptw) {
      return { success: false, error: "PTW not found" };
    }

    const result = await this.updatePTW(id, {
      status: 'PENDING_HSE_APPROVAL'
    });

    if (!result.success) return result;

    await this.addPTWTimelineEntry(
      id,
      'Approved by EFS',
      'HSE_FINAL_REVIEW'
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || 'System',
      role: 'efs',
      module: 'PTW',
      action: 'Approved by EFS',
      status: 'PENDING_HSE_APPROVAL',
      details: `PTW ${id} approved by EFS`,
    });

    return { success: true };

  } catch (error: any) {
    console.error("approvePTWEFS error:", error);
    return { success: false, error: error.message };
  }
}

  // Auto-generate badge IDs deterministically
private generateBadgeIds(ptwId: string, workerList: Worker[]): Worker[] {
  const normalizedPtwId = ptwId.replace(/-/g, '');

  return workerList.map((worker, index) => {

    // If badge already exists → keep it (IMPORTANT for DB consistency)
    if (worker.badge_id || worker.badgeId) {
      return worker;
    }

    const badge = `UNI-BDG-${normalizedPtwId}-${String(index + 1).padStart(2, '0')}`;

    return {
      ...worker,
      badge_id: badge,
      badgeId: badge
    };
  });
}

private async saveWorkerBadges(ptw: PTW): Promise<void> {
  try {
    const workers = this.generateBadgeIds(ptw.id, ptw.worker_list || []);
    const contractor = this.state.contractors.find(c => c.id === ptw.contractor_id);

    const badgeRows = workers.map((worker) => ({
      badge_id: worker.badge_id || worker.badgeId,
      worker_name: worker.name,
      company: contractor?.companyName || "Contractor",
      role: worker.role || "Worker",
      ptw_id: ptw.id,
      moc_id: ptw.moc_id,
      validity_start: (ptw as any).start_datetime || ptw.startDatetime,
      validity_end: (ptw as any).end_datetime || ptw.end_datetime,
      qr_code: worker.badge_id || worker.badgeId,
    }));

    const { error } = await supabase
      .from("worker_badges")
      .upsert(badgeRows, { onConflict: "badge_id" });

    if (error) throw error;

    await supabase
      .from("ptws")
      .update({
        worker_list: workers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ptw.id);

  } catch (err) {
    console.error("saveWorkerBadges failed:", err);
  }
}

async createSecurityCheckInLog(ptwId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("security_logs")
      .insert({
        ptw_id: ptwId,
        check_in_time: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (err) {
    console.error("Security check-in log failed:", err);
  }
}

async updateSecurityCheckOutLog(ptwId: string): Promise<void> {
  try {
    const { data: existingLog, error: fetchError } = await supabase
      .from("security_logs")
      .select("id")
      .eq("ptw_id", ptwId)
      .is("check_out_time", null)
      .order("check_in_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existingLog) return;

    const { error } = await supabase
      .from("security_logs")
      .update({
        check_out_time: new Date().toISOString(),
        check_out_verified_by: this.state.currentUser?.id || null,
      })
      .eq("id", existingLog.id);

    if (error) throw error;
  } catch (err) {
    console.error("Security checkout log failed:", err);
  }
}


  // Generic approve function that routes to correct next status
async approveReviewStep(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find((p) => p.id === id);
    if (!ptw) {
      return { success: false, error: "PTW not found" };
    }

    let nextStatus: PTWStatus;
    let action: string;

    switch (ptw.status) {
      case 'PENDING_SECURITY_REVIEW':
        nextStatus = ptw.requires_facilities_review
          ? 'PENDING_FACILITIES_REVIEW'
          : ptw.requires_efs_review
          ? 'PENDING_EFS_REVIEW'
          : 'PENDING_HSE_APPROVAL';
        action = 'Approved by Security';
        break;

      default:
        return { success: false, error: `Unsupported review step: ${ptw.status}` };
    }

    const { error } = await supabase
      .from("ptws")
      .update({
        status: nextStatus,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await this.addPTWTimelineEntry(id, action, nextStatus);

    await this.addActivityLog({
      user: this.state.currentUser?.name || 'System',
      role: this.state.currentUser?.role || 'security',
      module: 'PTW',
      action,
      status: nextStatus,
      details: `PTW ${id} moved to ${nextStatus}`,
    });

    await this.syncFromDatabase();

    return { success: true };
  } catch (err: any) {
    console.error("Error in approveReviewStep:", err);
    return { success: false, error: err.message };
  }
}

async uploadPTWWorkLogPhoto(file: File, ptwId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${ptwId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('ptw-work-logs')
      .upload(fileName, file, {
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage
      .from('ptw-work-logs')
      .getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Photo upload failed' };
  }
} 


async addPTWWorkLog(
  ptwId: string,
  currentStatus: string,
  remarks: string,
  photoUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ptw_id: ptwId,
      logged_by: this.state.currentUser?.name || 'Supervisor',
      current_status: currentStatus,
      remarks,
      photo_url: photoUrl || null,
    };

    const { error } = await supabase
      .from('ptw_work_logs')
      .insert(payload);

    if (error) {
      return { success: false, error: error.message };
    }

    await this.addActivityLog({
      user: this.state.currentUser?.name || 'Supervisor',
      role: this.state.currentUser?.role || 'supervisor',
      module: 'PTW',
      action: 'Added Hourly Work Log',
      details: `Hourly work log added for PTW ${ptwId}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save work log' };
  }
}

async getPTWWorkLogs(ptwId: string): Promise<PTWWorkLog[]> {
  try {
    const { data, error } = await supabase
      .from('ptw_work_logs')
      .select('*')
      .eq('ptw_id', ptwId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch work logs failed:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Fetch work logs failed:', err);
    return [];
  }
}

async approveHSEClosure(id: string, notes: string): Promise<{ success: boolean; error?: string }> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'PENDING_HSE_CLOSURE') {
      return { success: false, error: 'PTW must be in PENDING_HSE_CLOSURE status' };
    }

    const hseName = this.state.currentUser?.name || 'HSE Manager';

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "CLOSED",
        hseClosureApprovedAt: new Date(),
        hseClosureApprovedBy: hseName,
        hseClosureNotes: notes,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // Sync workflow store state
    await this.syncFromDatabase();

    this.addPTWTimelineEntry(id, 'HSE Final Closure Approved', 'CLOSED');

    this.addActivityLog({
      user: hseName,
      role: 'hse_manager',
      module: 'PTW',
      action: 'Final Closure Approved',
      status: 'CLOSED',
      details: `PTW ${id} closed by HSE Manager`,
    });

    this.addNotification({
      user_id: ptw.contractor_id || 'u7',
      title: 'PTW Closed',
      message: `PTW ${id} - ${ptw.title} has been closed by HSE`,
      link: `/ptw/${id}`,
      type: 'closure_approved',
    });

    return { success: true };

  } catch (err) {
    console.error("HSE closure approval failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async rejectPTW(id: string, reason: string): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    // Optional safety check (avoid duplicate rejection)
    if (ptw.status === "REJECTED") return;

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "REJECTED",
        rejection_reason: reason,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // Refresh workflow memory state
    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      "Rejected",
      "REJECTED",
      reason
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: this.state.currentUser?.role || "hse_manager",
      module: "PTW",
      action: "Rejected",
      status: "REJECTED",
      details: `PTW ${id} rejected: ${reason}`,
    });

  } catch (err) {
    console.error("PTW rejection DB update failed:", err);
  }
}

async sendBackPTW(
  id: string,
  toRole: Role,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find((p) => p.id === id);

    if (!ptw) {
      return { success: false, error: "PTW not found" };
    }

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "SENT_BACK",
        sent_back_to_role: toRole,
        sent_back_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("sendBackPTW supabase error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return { success: false, error: error.message };
    }

    await this.addPTWTimelineEntry(
      id,
      `Sent Back to ${toRole}`,
      "SENT_BACK",
      reason
    );

    await this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: this.state.currentUser?.role || "security",
      module: "PTW",
      action: `Sent Back to ${toRole}`,
      status: "SENT_BACK",
      details: `PTW ${id} sent back: ${reason}`,
    });

    await this.syncFromDatabase();

    return { success: true };
  } catch (err: any) {
    console.error("PTW send back failed:", err);
    return { success: false, error: err?.message || "PTW send back failed" };
  }
}

async resubmitPTW(id: string): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    // Prevent duplicate resubmission
    if (ptw.status === "PENDING_SECURITY_REVIEW") return;

    const newRevision = (ptw.revision_number || 0) + 1;

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "PENDING_SECURITY_REVIEW",
        sent_back_to_role: null,
        sent_back_reason: null,
        revision_number: newRevision,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      `Resubmitted (Rev ${newRevision})`,
      "PENDING_SECURITY_REVIEW",
      "Workflow resubmitted"
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "contractor_admin",
      module: "PTW",
      action: `Resubmitted Rev ${newRevision}`,
      status: "PENDING_SECURITY_REVIEW",
      details: `PTW ${id} resubmitted for review`,
    });

  } catch (err) {
    console.error("PTW resubmit failed:", err);
  }
}


async checkInPTW(id: string, checklist: Record<string, boolean>): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    // Prevent duplicate check-in
    if (ptw.status === "ACTIVE") return;

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "ACTIVE",
        security_checkin_time: new Date(),
        security_checklist: checklist,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // Sync workflow memory cache
    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      "Checked In - Work Started",
      "ACTIVE"
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "security",
      module: "SECURITY",
      action: "Checked In",
      status: "ACTIVE",
      details: `PTW ${id} checked in - work started`,
    });

  } catch (err) {
    console.error("PTW check-in failed:", err);
  }
}

async addProgressLog(id: string, remarks: string): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    const progressLogs = Array.isArray(ptw.progress_logs)
      ? [...ptw.progress_logs]
      : [];

    const newLog = {
      id: `pl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: this.state.currentUser?.name || "System",
      remarks
    };

    progressLogs.push(newLog);

    const { error } = await supabase
      .from("ptws")
      .update({
        progress_logs: progressLogs,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "security",
      module: "SECURITY",
      action: "Added Progress Log",
      details: `PTW ${id}: ${remarks}`,
    });

  } catch (err) {
    console.error("Progress log update failed:", err);
  }
}

async markWorkCompleted(id: string): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    // Prevent duplicate completion
    if (ptw.status === "WORK_COMPLETED") return;

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "WORK_COMPLETED",
        work_completed_date: new Date(),
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      "Work Completed by Contractor",
      "WORK_COMPLETED"
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "contractor_admin",
      module: "PTW",
      action: "Marked Work Completed",
      status: "WORK_COMPLETED",
      details: `PTW ${id} marked as work completed`,
    });

    // Notification recipients
    const notificationRecipients = [
      {
        userId: "u6",
        title: "Job Completion Review Required",
        link: `/supervisor/close-job?ptwId=${id}`
      },
      {
        userId: "u4",
        title: "Job Completion Review Required",
        link: `/efs/closure?ptwId=${id}`
      },
      {
        userId: "u3",
        title: "Job Completion Review Required",
        link: `/facilities/closure?ptwId=${id}`
      },
      {
        userId: "u1",
        title: "Job Closure Approval Required",
        link: `/hse/closure?ptwId=${id}`
      }
    ];

    notificationRecipients.forEach(recipient => {
      this.addNotification({
        user_id: recipient.userId,
        title: recipient.title,
        message: `PTW ${id} work has been marked complete and requires your review for closure.`,
        type: 'info',
        link: recipient.link
      });
    });

  } catch (err) {
    console.error("Mark work completed failed:", err);
  }
}

async checkOutPTW(id: string): Promise<void> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return;

    // Workflow validation
    if (ptw.status !== "ACTIVE") return;

    // Prevent duplicate checkout
    if (ptw.status === "WORK_FINISHED") return;

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "WORK_FINISHED",
        check_out_time: new Date(),
        check_out_verified_by: this.state.currentUser?.name || "System",
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      "Verified and Checked Out",
      "WORK_FINISHED"
    );

    this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "security",
      module: "SECURITY",
      action: "Checked Out",
      status: "WORK_FINISHED",
      details: `PTW ${id} verified and checked out`,
    });

  } catch (err) {
    console.error("PTW checkout failed:", err);
  }
}

async completeSupervisorClosure(id: string, notes: string): Promise<{ success: boolean; error?: string }> {
  try {

    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'WORK_COMPLETED') {
      return { success: false, error: 'PTW must be in WORK_COMPLETED status' };
    }

    const supervisorName = this.state.currentUser?.name || 'Supervisor';

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "PENDING_FACILITIES_CLOSURE",
        supervisorClosureCompletedAt: new Date(),
        supervisorClosureCompletedBy: supervisorName,
        supervisorClosureNotes: notes,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addPTWTimelineEntry(id, 'Supervisor Closure Completed', 'PENDING_FACILITIES_CLOSURE');

    this.addActivityLog({
      user: supervisorName,
      role: 'supervisor',
      module: 'PTW',
      action: 'Completed Closure Checklist',
      status: 'PENDING_FACILITIES_CLOSURE',
      details: `PTW ${id} supervisor closure completed, awaiting facilities review`,
    });

    this.addNotification({
      user_id: 'u3',
      title: 'PTW Closure Review Required',
      message: `PTW ${id} requires facilities closure review`,
      link: `/ptw/${id}`,
      type: 'closure_review',
    });

    return { success: true };

  } catch (err) {
    console.error("Supervisor closure failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async approveFacilitiesClosure(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'PENDING_FACILITIES_CLOSURE') {
      return { success: false, error: 'Invalid PTW status' };
    }

    const facilitiesName = this.state.currentUser?.name || 'Facilities Manager';

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "PENDING_HSE_CLOSURE",
        facilitiesClosureApprovedAt: new Date(),
        facilitiesClosureApprovedBy: facilitiesName,
        facilitiesClosureNotes: notes,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // ✅ Sync DB → Memory (Important)
    await this.syncFromDatabase();

    // ✅ Timeline log
    this.addPTWTimelineEntry(
      id,
      'Facilities Closure Approved',
      'PENDING_HSE_CLOSURE'
    );

    // ✅ Activity log
    this.addActivityLog({
      user: facilitiesName,
      role: 'facilities',
      module: 'PTW',
      action: 'Approved Closure Review',
      status: 'PENDING_HSE_CLOSURE',
      details: `PTW ${id} facilities closure approved`
    });

    // ✅ Notification
    this.addNotification({
      user_id: 'u1',
      title: 'PTW Final Closure Approval Required',
      message: `PTW ${id} requires HSE final closure approval`,
      link: `/ptw/${id}`,
      type: 'closure_approval'
    });

    return { success: true };

  } catch (err) {
    console.error("Facilities closure approval failed:", err);
    return { success: false, error: "Database update failed" };
  }
}
  // Facilities rejects closure - returns to work completed
async rejectFacilitiesClosure(
  id: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'PENDING_FACILITIES_CLOSURE') {
      return {
        success: false,
        error: 'Invalid PTW status'
      };
    }

    const facilitiesName =
      this.state.currentUser?.name || 'Facilities Manager';

    // ✅ Update database first
    const { error } = await supabase
      .from("ptws")
      .update({
        status: "WORK_COMPLETED",
        sent_back_to_role: "supervisor",
        sent_back_reason: reason,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // ✅ Sync store memory AFTER DB update
    await this.syncFromDatabase();

    // ✅ Timeline log
    this.addPTWTimelineEntry(
      id,
      'Facilities Closure Rejected',
      'WORK_COMPLETED',
      reason
    );

    // ✅ Activity log
    this.addActivityLog({
      user: facilitiesName,
      role: 'facilities',
      module: 'PTW',
      action: 'Rejected Closure Review',
      status: 'WORK_COMPLETED',
      details: `PTW ${id} closure rejected by facilities: ${reason}`
    });

    // ✅ Notification
    this.addNotification({
      user_id: 'u6',
      title: 'PTW Closure Rejected',
      message: `PTW ${id} closure rejected by facilities: ${reason}`,
      link: `/ptw/${id}`,
      type: 'closure_rejected'
    });

    return { success: true };

  } catch (err) {
    console.error("Facilities closure rejection failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // HSE final approval - closes the PTW
async approveHSEClosure(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'PENDING_HSE_CLOSURE') {
      return { success: false, error: 'Invalid PTW status' };
    }

    const hseName = this.state.currentUser?.name || 'HSE Manager';

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "CLOSED",
        hseClosureApprovedAt: new Date(),
        hseClosureApprovedBy: hseName,
        hseClosureNotes: notes,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    // Sync workflow store memory
    await this.syncFromDatabase();

    this.addPTWTimelineEntry(id, 'HSE Final Closure Approved', 'CLOSED');

    this.addActivityLog({
      user: hseName,
      role: 'hse_manager',
      module: 'PTW',
      action: 'Final Closure Approved',
      status: 'CLOSED',
      details: `PTW ${id} closed by HSE Manager`
    });

    this.addNotification({
      user_id: ptw.contractor_id || 'u7',
      title: 'PTW Closed',
      message: `PTW ${id} - ${ptw.title} has been closed by HSE`,
      link: `/ptw/${id}`,
      type: 'closure_approved'
    });

    return { success: true };

  } catch (err) {
    console.error("HSE closure approval failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // HSE rejects closure - returns to facilities
async rejectHSEClosure(
  id: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ptw = this.state.ptws.find(p => p.id === id);
    if (!ptw) return { success: false, error: 'PTW not found' };

    if (ptw.status !== 'PENDING_HSE_CLOSURE') {
      return { success: false, error: 'Invalid PTW status' };
    }

    const hseName = this.state.currentUser?.name || 'HSE Manager';

    const { error } = await supabase
      .from("ptws")
      .update({
        status: "PENDING_FACILITIES_CLOSURE",
        sent_back_to_role: "facilities",
        sent_back_reason: reason,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    this.addPTWTimelineEntry(
      id,
      'HSE Closure Rejected',
      'PENDING_FACILITIES_CLOSURE',
      reason
    );

    this.addActivityLog({
      user: hseName,
      role: 'hse_manager',
      module: 'PTW',
      action: 'Rejected Closure',
      status: 'PENDING_FACILITIES_CLOSURE',
      details: `PTW ${id} closure rejected by HSE: ${reason}`
    });

    this.addNotification({
      user_id: 'u3',
      title: 'PTW Closure Rejected by HSE',
      message: `PTW ${id} closure rejected by HSE: ${reason}`,
      link: `/ptw/${id}`,
      type: 'closure_rejected'
    });

    return { success: true };

  } catch (err) {
    console.error("HSE closure rejection failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // Legacy method for backward compatibility
async closeJob(id: string): Promise<void> {
  try {
    const result = await this.completeSupervisorClosure(
      id,
      'Supervisor closure completed'
    );

    if (!result.success) {
      console.error('closeJob failed:', result.error);
    }

  } catch (err) {
    console.error('closeJob exception:', err);
  }
}
  // Helper for backward compatibility
async approveJobClosure(
  id: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await this.approveHSEClosure(
      id,
      `Approved by ${userName}`
    );
  } catch (err) {
    console.error("approveJobClosure failed:", err);
    return { success: false, error: "Job closure approval failed" };
  }
}
private async addPTWTimelineEntry(
  ptwId: string,
  action: string,
  status: string,
  remarks?: string
): Promise<void> {
  try {
    const { data: ptw } = await supabase
      .from("ptws")
      .select("timeline")
      .eq("id", ptwId)
      .maybeSingle();

    if (!ptw) return;

    const timeline = ptw.timeline || [];

    const entry: TimelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: new Date(),
      user: this.state.currentUser?.name || "System",
      role: this.state.currentUser?.role || "contractor",
      action,
      status,
      remarks,
    };

    timeline.push(entry);

    const { error } = await supabase
      .from("ptws")
      .update({
        timeline,
        updated_at: new Date(),
      })
      .eq("id", ptwId);

    if (error) throw error;

    await this.syncFromDatabase();

  } catch (err) {
    console.error("Timeline update failed:", err);
  }
}

  // Contractor document actions
async uploadDocument(folder: string, fileName: string): Promise<string> {
  try {
    const id = `doc-${Date.now()}`;

    const doc: ContractorDocument = {
      id,
      contractor_id: this.state.currentUser?.id || "u3",
      folder,
      file_name: fileName,
      uploaded_at: new Date(),
      status: "PENDING",
    };

    const { error } = await supabase
      .from("contractor_documents")
      .insert(doc);

    if (error) throw error;

    await this.syncFromDatabase();

    await this.addActivityLog({
      user: this.state.currentUser?.name || "System",
      role: "contractor_admin",
      module: "CONTRACTOR",
      action: "Uploaded Document",
      details: `Uploaded ${fileName} to ${folder}`,
    });

    return id;

  } catch (err) {
    console.error("Document upload failed:", err);
    return "";
  }
}

async approveDocument(id: string, remarks?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("contractor_documents")
      .update({
        status: "APPROVED",
        reviewed_by: this.state.currentUser?.name,
        reviewed_at: new Date(),
        remarks,
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

  } catch (err) {
    console.error("Approve document failed:", err);
  }
}

async rejectDocument(id: string, remarks: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("contractor_documents")
      .update({
        status: "REJECTED",
        reviewed_by: this.state.currentUser?.name,
        reviewed_at: new Date(),
        remarks,
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

  } catch (err) {
    console.error("Reject document failed:", err);
  }
}

  // Activity log helper
private async addActivityLog(
  log: Omit<ActivityLog, "id" | "timestamp">
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        username: log.user,
        role: log.role,
        module: log.module,
        action: log.action,
        status: log.status ?? null,
        details: log.details ?? "",
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    this.state.activityLog = [data, ...(this.state.activityLog || [])];
    await this.saveState();
    this.notify();
  } catch (err) {
    console.error("Activity log insert failed:", err);
  }
}
  // Security Entry Workflow Methods
async scanWorkerByBadge(ptwId: string, badge: string): Promise<Worker | null> {
  try {
    const { data, error } = await supabase
      .from("ptws")
      .select("worker_list")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !data) return null;

    const workerList: Worker[] = data.worker_list || [];

    const worker = workerList.find(
      w => w.badgeId === badge || w.badge_id === badge
    );

    return worker || null;

  } catch (err) {
    console.error("Worker scan failed:", err);
    return null;
  }
}

async updateWorkerChecklist(
  ptwId: string,
  badge: string,
  checklist: { id: string; label: string; required: boolean; checked: boolean }[]
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("ptws")
      .select("worker_list, entry_logs")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !data) {
      console.error("PTW fetch failed:", error);
      return;
    }

    const workerList: Worker[] = data.worker_list || [];

    const workerIndex = workerList.findIndex(
      (w) =>
        w.badgeId === badge ||
        w.badge_id === badge ||
        w.badge === badge
    );

    if (workerIndex === -1) {
      console.error("Worker not found for badge:", badge);
      return;
    }

    const worker = workerList[workerIndex];

    const allRequiredChecked = checklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    const updatedWorker = {
      ...worker,
      entryChecklist: checklist,
      entryStatus: allRequiredChecked ? "PASSED" : "IN_PROGRESS",
      checkedInAt: allRequiredChecked
        ? new Date().toISOString()
        : worker.checkedInAt,
    };

    workerList[workerIndex] = updatedWorker;

    const passedCount = workerList.filter(
      (w) => w.entryStatus === "PASSED"
    ).length;

    const totalCount = workerList.length;

    const entryLogs = data.entry_logs || [];

    entryLogs.push({
      at: new Date().toISOString(),
      by: this.state.currentUser?.name || "Security",
      action: allRequiredChecked ? "WORKER_PASSED" : "CHECKLIST_UPDATED",
      workerBadge: badge,
      workerName: worker.name,
    });

    const { error: updateError } = await supabase
      .from("ptws")
      .update({
        worker_list: workerList,
        entry_progress: {
          passed: passedCount,
          total: totalCount,
        },
        entry_logs: entryLogs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ptwId);

    if (updateError) {
      console.error("Worker checklist update DB failed:", updateError);
      throw updateError;
    }

    await this.syncFromDatabase();
  } catch (err) {
    console.error("Worker checklist update failed:", err);
  }
}

async approveEntry(ptwId: string, approvedBy: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("ptws")
      .select("worker_list, entry_logs, entry_progress")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !data) {
      console.error("PTW fetch failed:", error);
      return false;
    }

    const progress = data.entry_progress || { passed: 0, total: 0 };

    if (progress.total === 0 || progress.passed !== progress.total) {
      return false;
    }

    const entryLogs = Array.isArray(data.entry_logs) ? [...data.entry_logs] : [];

    entryLogs.push({
      at: new Date().toISOString(),
      by: approvedBy,
      action: "ENTRY_APPROVED",
    });

    const { error: updateError } = await supabase
      .from("ptws")
      .update({
        status: "ACTIVE",
        entry_logs: entryLogs,
        entry_approved_at: new Date().toISOString(),
        entry_approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ptwId);

    if (updateError) {
      console.error("PTW activate update failed:", updateError);
      throw updateError;
    }

    await this.createSecurityCheckInLog(ptwId);

    await this.syncFromDatabase();

    await this.addPTWTimelineEntry(
      ptwId,
      "Entry Approved - PTW Activated",
      "ACTIVE"
    );

    await this.addActivityLog({
      user: approvedBy,
      role: "security",
      module: "PTW",
      action: "Entry Approved",
      status: "ACTIVE",
      details: `All workers checked in - PTW ${ptwId} activated`,
    });

    return true;
  } catch (err) {
    console.error("Entry approval failed:", err);
    return false;
  }
}

  // Hourly Work Log - for ACTIVE PTWs only
async addWorkLog(
  ptwId: string,
  by: string,
  note: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!note || !note.trim()) {
      return { success: false, error: "Work log note is required" };
    }

    if (!photoUrl || !photoUrl.trim()) {
      return { success: false, error: "Photo is required for work logs" };
    }

    const { data, error } = await supabase
      .from("ptws")
      .select("status, workLogs, entryLogs")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !data)
      return { success: false, error: "PTW not found" };

    if (data.status !== "ACTIVE") {
      return { success: false, error: "Can only add work logs to ACTIVE PTWs" };
    }

    const workLogs = data.workLogs || [];

    workLogs.push({
      at: new Date().toISOString(),
      by,
      note,
      photoUrl,
    });

    const entryLogs = data.entryLogs || [];

    entryLogs.push({
      at: new Date().toISOString(),
      by,
      action: "HOURLY_LOG_ADDED",
    });

    const { error: updateError } = await supabase
      .from("ptws")
      .update({
        workLogs,
        entryLogs,
        updated_at: new Date(),
      })
      .eq("id", ptwId);

    if (updateError) throw updateError;

    await this.syncFromDatabase();

    await this.addActivityLog({
      user: by,
      role: "supervisor",
      module: "PTW",
      action: "Added Hourly Work Log",
      details: `Work log added for PTW ${ptwId}: ${note}`,
    });

    return { success: true };

  } catch (err) {
    console.error("Work log add failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // Job Closure Approval by HSE Manager
async approveJobClosure(
  ptwId: string,
  by: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ptw, error } = await supabase
      .from("ptws")
      .select("*")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !ptw)
      return { success: false, error: "PTW not found" };

    if (ptw.status !== "WORK_COMPLETED") {
      return {
        success: false,
        error: "Can only close PTWs with WORK_COMPLETED status",
      };
    }

    const timeline = ptw.timeline || [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date(),
      user: by,
      role: "hse_manager",
      action: "Job Closed by HSE",
      status: "CLOSED",
    });

    const { error: updateError } = await supabase
      .from("ptws")
      .update({
        status: "CLOSED",
        timeline,
        closed_at: new Date(),
        closed_by: by,
        updated_at: new Date(),
      })
      .eq("id", ptwId);

    if (updateError) throw updateError;

    await this.syncFromDatabase();

    await this.addActivityLog({
      user: by,
      role: "hse_manager",
      module: "PTW",
      action: "Job Closed",
      status: "CLOSED",
      details: `PTW ${ptwId} closed by HSE Manager`,
    });

    await this.addNotification({
      user_id: ptw.contractor_id,
      title: "Job Closed",
      message: `PTW ${ptwId} has been reviewed and closed by HSE Manager.`,
      type: "success",
      link: "/permits",
    });

    return { success: true };

  } catch (err) {
    console.error("Job closure approval failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // Security Check-out - for ACTIVE PTWs only
async confirmSecurityCheckout(
  ptwId: string,
  by: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ptw, error } = await supabase
      .from("ptws")
      .select("status, timeline")
      .eq("id", ptwId)
      .maybeSingle();

    if (error || !ptw) {
      return { success: false, error: "PTW not found" };
    }

    if (ptw.status !== "ACTIVE") {
      return { success: false, error: "Can only check out ACTIVE PTWs" };
    }

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: by,
      role: "security",
      action: `Security Check-out confirmed${notes ? ": " + notes : ""}`,
      status: "ACTIVE",
      remarks: notes,
    });

    const { error: updateError } = await supabase
      .from("ptws")
      .update({
        timeline,
        security_checkout_confirmed_by: by,
        security_checkout_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ptwId);

    if (updateError) {
      console.error("PTW checkout update failed:", updateError);
      throw updateError;
    }

    await this.updateSecurityCheckOutLog(ptwId);

    await this.syncFromDatabase();

    await this.addActivityLog({
      user: by,
      role: "security",
      module: "SECURITY",
      action: "Security Check-out Confirmed",
      details: `PTW ${ptwId} - Workers checked out${notes ? ": " + notes : ""}`,
    });

    return { success: true };
  } catch (err) {
    console.error("Security checkout confirmation failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

  // Add notification helper
private async addNotification(
  notification: Omit<Notification, "id" | "created_at" | "read">
): Promise<void> {
  try {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      created_at: new Date(),
      read: false,
      ...notification,
    };

    const { error } = await supabase
      .from("notifications")
      .insert(newNotification);

    if (error) throw error;

    await this.syncFromDatabase();

  } catch (err) {
    console.error("Notification insert failed:", err);
  }
}

  // User Management Actions
async addUser(
  user: {
    username: string;
    name: string;
    email: string;
    role: Role;
    is_active: boolean;
    password: string;
  }
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // get session token (to prove the caller is logged in)
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    const token = sessionData.session?.access_token;
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/admin/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.error || "Failed to create user" };
    }

    // OPTIONAL: refresh local state after creation
    // await this.syncFromDatabase();

    return { success: true, id: json?.auth_id };
  } catch (err: any) {
    console.error("Add user failed:", err);
    return { success: false, error: err?.message || "Request failed" };
  }
}

async updateUser(
  id: string,
  patch: Partial<Omit<User, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (patch.email) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .neq("id", id)
        .eq("email", patch.email)
        .maybeSingle();

      if (data) {
        return { success: false, error: "A user with this email already exists" };
      }
    }

    const { error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Update user failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async toggleUserActive(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("is_active")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "User not found" };
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: !data.is_active,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Toggle user active failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, role, contractor_id, stakeholder_id')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return { success: false, error: 'User not found' };
    }

    if (
      (user.role === 'contractor_admin' || user.role === 'contractor_supervisor') &&
      user.contractor_id
    ) {
      const { data: deletedContractor, error: contractorDeleteError } = await supabase
        .from('contractors')
        .delete()
        .eq('id', user.contractor_id)
        .select('id');

      if (contractorDeleteError) {
        console.error('Contractor delete error:', contractorDeleteError);
        throw contractorDeleteError;
      }

      console.log('Deleted contractor:', deletedContractor);
    }

    if (user.role === 'stakeholder' && user.stakeholder_id) {
      const { data: deletedStakeholder, error: stakeholderDeleteError } = await supabase
        .from('stakeholders')
        .delete()
        .eq('id', user.stakeholder_id)
        .select('id');

      if (stakeholderDeleteError) {
        console.error('Stakeholder delete error:', stakeholderDeleteError);
        throw stakeholderDeleteError;
      }

      console.log('Deleted stakeholder:', deletedStakeholder);
    }

    const { data: deletedUser, error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select('id');

    if (userDeleteError) {
      console.error('User delete error:', userDeleteError);
      throw userDeleteError;
    }

    if (!deletedUser || deletedUser.length === 0) {
      return { success: false, error: 'Delete blocked or no row was deleted' };
    }

    await this.syncFromDatabase();

    return { success: true };
  } catch (err: any) {
    console.error('Delete user failed:', err);
    return { success: false, error: err?.message || 'Database delete failed' };
  }
}

  // Contractor Management Actions
async addContractor(contractor: {
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  password?: string;
}) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { success: false, error: "Not authenticated" };

    const res = await fetch("/api/admin/contractors/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contractor),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.error || "Failed to create contractor" };
    }

    await this.syncFromDatabase();

    return { success: true, id: json.id };
  } catch (err) {
    console.error("Add contractor failed:", err);
    return { success: false, error: "Request failed" };
  }
}

async updateContractor(
  id: string,
  patch: Partial<Omit<Contractor, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (patch.email) {
      const { data } = await supabase
        .from("contractors")
        .select("id")
        .ilike("email", patch.email)
        .neq("id", id);

      if (data && data.length > 0) {
        return { success: false, error: "Email already exists" };
      }
    }

    const { error } = await supabase
      .from("contractors")
      .update({
        ...patch,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Update contractor failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async toggleContractorActive(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const contractor = await supabase
      .from("contractors")
      .select("is_active")
      .eq("id", id)
      .maybeSingle();

    if (!contractor.data) {
      return { success: false, error: "Contractor not found" };
    }

    const { error } = await supabase
      .from("contractors")
      .update({
        is_active: !contractor.data.is_active,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Toggle contractor failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async deleteContractor(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("contractors")
      .update({
        deleted_at: new Date(),
        is_active: false,
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Delete contractor failed:", err);
    return { success: false, error: "Database delete failed" };
  }
}

async loadContractors() {
  try {
    const { data, error } = await supabase
      .from("contractors")
      .select("*");

    if (error) throw error;

    this.state.contractors = data || [];
    this.saveState();
    this.notify();

  } catch (err) {
    console.error("Load contractors failed", err);
  }
}

  // Stakeholder Management Actions

async addStakeholder(payload: any) {
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      return { success: false, error: sessionErr.message };
    }

    const token = sessionData.session?.access_token;
    if (!token) {
      return { success: false, error: "No access token. Please login again." };
    }

    const res = await fetch("/api/admin/stakeholders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.error || "Request failed" };
    }

    await this.syncFromDatabase();

    return { success: true, id: json.id };
  } catch (err: any) {
    console.error("Add stakeholder failed:", err);
    return { success: false, error: err?.message || "Request failed" };
  }
}


async loadStakeholders() {
  try {
    const { data, error } = await supabase
      .from("stakeholders")
      .select("*");

    if (error) throw error;

    this.state.stakeholders = data || [];
    this.saveState();
    this.notify();

  } catch (err) {
    console.error("Load stakeholders failed", err);
  }
}



async updateStakeholder(
  id: string,
  patch: Partial<Omit<Stakeholder, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (patch.email) {
      const { data } = await supabase
        .from("stakeholders")
        .select("id")
        .ilike("email", patch.email)
        .neq("id", id);

      if (data && data.length > 0) {
        return { success: false, error: "A stakeholder with this email already exists" };
      }
    }

    const { error } = await supabase
      .from("stakeholders")
      .update({
        ...patch,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Update stakeholder failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async toggleStakeholderActive(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const stakeholder = await supabase
      .from("stakeholders")
      .select("is_active")
      .eq("id", id)
      .maybeSingle();

    if (!stakeholder.data) {
      return { success: false, error: "Stakeholder not found" };
    }

    const { error } = await supabase
      .from("stakeholders")
      .update({
        is_active: !stakeholder.data.is_active,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Toggle stakeholder failed:", err);
    return { success: false, error: "Database update failed" };
  }
}

async deleteStakeholder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("stakeholders")
      .update({
        deleted_at: new Date(),
        is_active: false,
      })
      .eq("id", id);

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err) {
    console.error("Delete stakeholder failed:", err);
    return { success: false, error: "Database delete failed" };
  }
}



async updateStakeholderSignature(
  stakeholderId: string,
  canvas: HTMLCanvasElement
): Promise<{ success: boolean; error?: string }> {
  try {

    // ✅ Convert canvas → blob
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      return { success: false, error: "Signature canvas is empty" };
    }

    const fileName = `stakeholder-sign-${stakeholderId}-${Date.now()}.png`;

    // ✅ Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    // ✅ Get Public URL
    const { data } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    // ✅ Save URL in database
    const { error } = await supabase
      .from("user_signatures")
      .upsert({
        user_id: stakeholderId,
        signature_url: data.publicUrl,
        updated_at: new Date()
      });

    if (error) throw error;

    await this.syncFromDatabase();

    return { success: true };

  } catch (err: any) {
    console.error("Stakeholder signature update failed:", err);
    return {
      success: false,
      error: err.message || "Signature upload failed"
    };
  }
}


async uploadUserSignature(
  userId: string,
  canvas: HTMLCanvasElement
) {
  try {

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      return { success: false, error: "Signature is empty" };
    }

    const fileName = `signature-${userId}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    await supabase.from("user_signatures").upsert({
      user_id: userId,
      signature_url: data.publicUrl,
      updated_at: new Date().toISOString()
    });

    await this.syncFromDatabase();

    return { success: true };

  } catch (err:any) {
    return { success: false, error: err.message };
  }
}

  // Utility methods
async resetState(): Promise<void> {
  try {
    this.state = createInitialState();

    // Clear sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    // Reload from database to keep source of truth
    await this.syncFromDatabase();

    this.notify();

  } catch (err) {
    console.error("State reset failed:", err);
  }
}
}

export const workflowStore = new WorkflowStore();
