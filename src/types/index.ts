export type Organization = { id: string; name: string; initials: string; color: string; demo: boolean };
export type Person = { id: string; nid: string | null; matchStatus: 'Matched' | 'Identity unavailable' };
export type EmploymentStatus = 'Active' | 'Left';
export type Assignment = {
  id: string; personId: string | null; employeeId: string; loginId: string; name: string;
  organization: string; department: string; designation: string; joined: string; exited: string | null;
  status: EmploymentStatus; region: string; area: string; territory: string; office: string;
  category: string; type: string; manager: string | null; employmentType: string; exitReason: string | null;
};
export type Switch = {
  id: string; personId: string; previous: Assignment; next: Assignment; gap: number | null;
  result: 'Switched' | 'Overlapping active assignments' | 'Incomplete history';
};
export type DateRange = { start: string; end: string };
export type ReportingPeriod = DateRange & { mode: 'monthly' | 'all'; label: string };
export type WorkforceSnapshot = {
  organizations: Organization[]; assignments: Assignment[]; people: Person[]; switches: Switch[];
  updatedAt: string; unavailableOrganizations: string[]; demo: true; reportingCoverage?: DateRange;
};
export const filterKeys = ['organization', 'region', 'area', 'territory', 'office', 'category', 'type', 'department', 'designation', 'status'] as const;
export type FilterKey = typeof filterKeys[number];
export type Filters = Record<FilterKey, string> & { month: string; period?: 'monthly' | 'all' };
export type Metric = 'all' | 'active' | 'opening' | 'joiners' | 'leavers' | 'retained' | 'early' | 'tenure' | 'cohort-retained' | 'cohort-left' | 'external' | 'internal';
export type EmployeeContext = { metric: Metric; reason?: string; band?: string; cohort?: string; elapsed?: string };
export type Summary = {
  opening: Assignment[]; active: Assignment[]; joiners: Assignment[]; leavers: Assignment[]; retained: Assignment[];
  attrition: number | null; retention: number | null; net: number; unique: number; excluded: number;
};
