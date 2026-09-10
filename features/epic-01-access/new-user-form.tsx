"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/forms/password-requirements";
import { MAX_DISPLAY_NAME_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, passwordMeetsRequirements } from "@/lib/api/authApi";
import { userRoleOptions } from "./role-catalog";
import { readCreatedUsers, saveCreatedUser } from "./admin-user-storage";
import type { UserAccount, UserRoleCode } from "./types";
import styles from "./access-ui.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewUserFormProps = {
  existingUsers: UserAccount[];
};

export function NewUserForm({ existingUsers }: NewUserFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRoleCode>("observer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const emailAlreadyExists = useMemo(
    () => existingUsers.some((user) => user.email.toLowerCase() === normalizedEmail),
    [existingUsers, normalizedEmail],
  );
  const displayNameValid = displayName.trim().length > 0 && displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH;
  const emailValid = EMAIL_PATTERN.test(normalizedEmail) && !emailAlreadyExists;
  const passwordValid = passwordMeetsRequirements(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = displayNameValid && emailValid && passwordValid && passwordsMatch;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Check the account details and try again.");
      return;
    }

    const storedUsers = readCreatedUsers();
    if (storedUsers.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      setError("An account with this email already exists.");
      return;
    }

    saveCreatedUser({
      id: `USR-${Date.now().toString().slice(-6)}`,
      name: displayName.trim(),
      email: normalizedEmail,
      role,
      status: "Active",
    });
    router.push("/admin/users");
  }

  return (
    <form className={styles.createUserCard} onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className={styles.sectionHeading}>Account details</h2>
        <p className={styles.sectionDescription}>
          Create an Observer, Case Coordinator or System Administrator account.
        </p>
      </div>

      <section className={styles.notice} role="status">
        <strong>Account creation is not available yet</strong>
        You can review and complete this form, but submitting it creates a preview
        record on this device only. No account will be created.
      </section>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="new-user-name">Display name</label>
          <input
            className={styles.input}
            id="new-user-name"
            type="text"
            autoComplete="name"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="new-user-email">Email</label>
          <input
            className={styles.input}
            id="new-user-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={emailAlreadyExists ? "new-user-email-error" : undefined}
            required
          />
          {emailAlreadyExists && (
            <span className={styles.fieldError} id="new-user-email-error">
              An account with this email already exists.
            </span>
          )}
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="new-user-role">Account role</label>
          <select
            className={styles.select}
            id="new-user-role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRoleCode)}
          >
            {userRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span className={styles.fieldHelp}>The selected role controls which workspace the user can access.</span>
        </div>

        <PasswordInput
          className={styles.field}
          inputClassName={styles.input}
          id="new-user-password"
          label="Temporary password"
          value={password}
          onChange={setPassword}
        />

        <div className={styles.field}>
          <label htmlFor="new-user-password-confirmation">Confirm temporary password</label>
          <input
            className={styles.input}
            id="new-user-password-confirmation"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-describedby="new-user-password-confirmation-help"
            required
          />
          <span
            className={confirmPassword.length > 0 && !passwordsMatch ? styles.fieldError : styles.fieldHelp}
            id="new-user-password-confirmation-help"
          >
            {confirmPassword.length > 0 && !passwordsMatch ? "The passwords do not match." : "Enter the temporary password again."}
          </span>
        </div>
      </div>

      {error && <p className={styles.formError} role="alert">{error}</p>}

      <div className={styles.buttonRow}>
        <button className={styles.primaryButton} type="submit" disabled={!canSubmit}>Create user account</button>
        <Link className={styles.secondaryButton} href="/admin/users">Cancel</Link>
      </div>
    </form>
  );
}
