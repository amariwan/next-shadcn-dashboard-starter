-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "dashboardId" TEXT NOT NULL DEFAULT 'overview',
    "layout" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dashboard_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dashboard_layouts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "dashboard_layouts_userId_idx" ON "dashboard_layouts"("userId");

-- CreateIndex
CREATE INDEX "dashboard_layouts_organizationId_idx" ON "dashboard_layouts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_userId_organizationId_dashboardId_key" ON "dashboard_layouts"("userId", "organizationId", "dashboardId");
