import type { SessionUser } from '../../../config/access/session';
import { authenticateWorkspaceAccount } from '../../admin/data/admin-preview';

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const createdAccount = await authenticateWorkspaceAccount(email, password);
  if (createdAccount) return createdAccount;
  await new Promise(resolve => setTimeout(resolve, 250));
  throw new Error('Workspace account is invalid or disabled. Ask the administrator to create or enable it.');
}
