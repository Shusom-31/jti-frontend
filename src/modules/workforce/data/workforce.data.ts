import type { Assignment, Organization, Person, Switch, WorkforceSnapshot } from '../../../types';
import { addDays, daysBetween } from '../../../lib/utils/format';

export const organizations: Organization[] = [
  { id: 'sky', name: 'Sky Tracker ltd', initials: 'ST', color: '#f8fafc', demo: false },
  { id: 'delta', name: 'Delta Connect', initials: 'DC', color: '#7786bc', demo: true },
  { id: 'nova', name: 'Nova Fieldforce', initials: 'NF', color: '#cf945a', demo: true },
];
const names = ['Ayesha Rahman', 'Tanvir Ahmed', 'Nusrat Jahan', 'Mehedi Hasan', 'Farhana Islam', 'Rakib Hossain', 'Sadia Akter', 'Imran Khan', 'Tasnim Chowdhury', 'Arif Mahmud', 'Samira Sultana', 'Raihan Kabir', 'Nabila Haque', 'Shakil Islam', 'Maliha Noor', 'Fahim Rahman', 'Rumana Yasmin', 'Sabbir Ahmed', 'Ishrat Jahan', 'Sohan Biswas', 'Moumita Das', 'Rifat Karim', 'Anika Tasnim', 'Hasib Khan'];
const locations = [
  ['Mymensingh', 'Sylhet', 'Sylhet', 'Sylhet Central'],
  ['Mymensingh', 'Sylhet', 'Sunamganj', 'Sunamganj Office'],
  ['Mymensingh', 'Mymensingh', 'Trishal', 'Trishal Office'],
  ['Dhaka', 'Dhaka North', 'Uttara', 'Uttara Office'],
  ['Dhaka', 'Dhaka South', 'Dhanmondi', 'Dhanmondi Office'],
  ['Chattogram', 'Chattogram', 'Agrabad', 'Agrabad Office'],
  ['Rajshahi', 'Bogra', 'Bogra Sadar', 'Bogra Office'],
  ['', '', '', ''],
];
const people: Person[] = [];
const assignments: Assignment[] = [];
function assignment(index: number, personId: string | null, agency: string, joined: string, exited: string | null, suffix = ''): Assignment {
  const location = locations[index % locations.length];
  return {
    id: `assignment-${index}${suffix}`, personId, employeeId: `00${String(index + 101).padStart(4, '0')}${suffix}`, loginId: `bp.${String(index + 1).padStart(5, '0')}${suffix}`,
    name: names[index % names.length], organization: agency, department: index % 5 === 0 ? 'Field Operations' : 'Brand Activation',
    designation: index % 8 === 0 ? 'Supervisor' : 'BA', joined, exited, status: exited ? 'Left' : 'Active',
    region: location[0], area: location[1], territory: location[2], office: location[3],
    category: ['Metro', 'Urban', 'Rural'][index % 3], type: index % 3 === 0 ? 'Campaign' : 'Prime',
    manager: index % 9 === 0 ? null : 'Shahriar Alam', employmentType: index % 3 === 0 ? 'Fixed term' : 'Permanent',
    exitReason: exited ? ['Career opportunity', 'Personal reasons', 'Contract ended', null][index % 4] : null,
  };
}
// Explicit fixture identities represent an authoritative upstream match, never a name/ID heuristic.
for (let i = 0; i < 168; i++) {
  const personId = i % 17 === 0 ? null : `person-${i}`;
  if (personId) people.push({ id: personId, nid: `0019${String(i + 100000).padStart(9, '0')}`, matchStatus: 'Matched' });
  const joined = i < 93 ? addDays('2025-10-01', i * 2) : addDays('2026-04-01', Math.min(208, (i - 93) * 3));
  const exited = i % 5 === 0 ? addDays(joined, 35 + (i * 11) % 210) : null;
  assignments.push(assignment(i, personId, organizations[i % 3].id, joined, exited && exited <= '2026-10-28' ? exited : null));
}
for (let i = 0; i < 18; i++) {
  const index = 200 + i;
  const personId = `person-${index}`;
  people.push({ id: personId, nid: `0028${String(index + 100000).padStart(9, '0')}`, matchStatus: 'Matched' });
  const joining = i < 9 ? `2026-10-${String(3 + i * 2).padStart(2, '0')}` : `2026-0${6 + (i % 4)}-12`;
  const previousExit = i === 0 ? joining : addDays(joining, i % 4 === 0 ? 5 : -(2 + i % 7));
  const previous = assignment(index, personId, organizations[i % 3].id, '2026-02-10', i === 1 || i === 2 ? null : previousExit, '-A');
  if (i === 2) previous.status = 'Left'; // Missing confirmed exit date: explicitly incomplete history.
  const next = assignment(index + 30, personId, organizations[(i + 1) % 3].id, joining, null, '-B');
  next.name = previous.name;
  assignments.push(previous, next);
}
// A second simultaneous active assignment with a missing previous exit.
const concurrentPerson = people.find(p => p.id === 'person-201')!;
const concurrent = assignment(299, concurrentPerson.id, 'sky', '2026-10-22', null, '-C');
concurrent.name = assignments.find(a => a.personId === concurrentPerson.id)!.name;
assignments.push(concurrent);

export function fixtureSnapshot(unavailable = ''): WorkforceSnapshot {
  const visible = assignments.filter(a => a.organization !== unavailable);
  const switches: Switch[] = [];
  for (const person of people) {
    const history = assignments.filter(a => a.personId === person.id).sort((a, b) => a.joined.localeCompare(b.joined));
    for (let i = 1; i < history.length; i++) {
      const previous = history[i - 1], next = history[i];
      if (previous.organization === next.organization) continue;
      if (previous.organization === unavailable || next.organization === unavailable) continue;
      const gap = previous.exited ? daysBetween(previous.exited, next.joined) : null;
      const bothActive = previous.status === 'Active' && next.status === 'Active' && !previous.exited && !next.exited;
      switches.push({ id: `${previous.id}:${next.id}`, personId: person.id, previous, next, gap,
        result: bothActive ? 'Overlapping active assignments' : gap === null ? 'Incomplete history' : 'Switched' });
    }
  }
  return { organizations, assignments: visible, people, switches, demo: true, updatedAt: '2026-10-28T10:30:00Z', reportingCoverage: { start: '2025-10-01', end: '2026-10-28' }, unavailableOrganizations: unavailable ? [unavailable] : [] };
}
