import { ROLES } from "@/types/auth";
import { useAuthStore } from "@/store/auth.store";
import { useBranchesQuery } from "@/features/branches";

/** Branches the viewer can filter by; the server enforces the same scope. */
export const useScopedBranches = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isHead = currentUser?.role === ROLES.HEAD;
  const { data: branches } = useBranchesQuery();

  return (branches ?? []).filter((branch) =>
    isHead ? true : (currentUser?.branches ?? []).includes(branch._id)
  );
};
