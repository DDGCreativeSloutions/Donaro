/*
  Warnings:

  - You are about to drop the column `phone` on the `OTP` table. All the data in the column will be lost.
  - Added the required column `email` to the `OTP` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OTP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_OTP" ("code", "createdAt", "expiresAt", "id", "updatedAt") SELECT "code", "createdAt", "expiresAt", "id", "updatedAt" FROM "OTP";
DROP TABLE "OTP";
ALTER TABLE "new_OTP" RENAME TO "OTP";
CREATE UNIQUE INDEX "OTP_email_key" ON "OTP"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
