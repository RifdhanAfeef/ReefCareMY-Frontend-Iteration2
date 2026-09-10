import type { Metadata } from "next";
import Link from "next/link";
import { PageTemplate } from "@/components/templates/page-template";
import { users } from "@/features/epic-01-access/mock-data";
import { UserDirectory } from "@/features/epic-01-access/user-directory";
import styles from "@/features/epic-01-access/access-ui.module.css";

export const metadata: Metadata = { title: "Manage users and access" };

export default function UsersPage() {
  return (
    <PageTemplate
      eyebrow="Administration / Users & roles"
      title="Manage users and access"
      description="View ReefCare accounts, assign roles and review access without exposing sensitive case content."
      headerAction={
        <Link className={styles.primaryButton} href="/admin/users/new">
          Add New User
        </Link>
      }
    >
      <UserDirectory initialUsers={users} />
    </PageTemplate>
  );
}
