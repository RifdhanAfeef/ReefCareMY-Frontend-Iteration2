import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { users } from "@/features/epic-01-access/mock-data";
import { NewUserForm } from "@/features/epic-01-access/new-user-form";

export const metadata: Metadata = { title: "Add New User" };

export default function AddNewUserPage() {
  return (
    <PageTemplate
      eyebrow="Administration / Users & roles"
      title="Add New User"
      description="Create an account and assign its initial ReefCare role."
      showBackButton
      backFallbackHref="/admin/users"
    >
      <NewUserForm existingUsers={users} />
    </PageTemplate>
  );
}
