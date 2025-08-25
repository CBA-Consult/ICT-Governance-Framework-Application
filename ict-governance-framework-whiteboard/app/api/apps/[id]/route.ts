import { type NextRequest, NextResponse } from "next/server"

// Mock detailed app data - in production this would come from a database
const getDetailedAppData = (id: string) => {
  // Extract app number from ID for consistent data generation
  const appNumber = Number.parseInt(id.replace("app-", "")) || 1

  const vendors = ["Microsoft", "Google", "Amazon", "Salesforce", "Adobe", "Slack", "Atlassian"]
  const categories = ["Productivity", "Communication", "Development", "Analytics", "Security"]

  const vendor = vendors[appNumber % vendors.length]
  const category = categories[appNumber % categories.length]

  return {
    id,
    name: `${vendor} ${category} Tool ${appNumber}`,
    vendor,
    category,
    description: `Professional ${category.toLowerCase()} solution for enterprise use with advanced features and enterprise-grade security.`,
    status: ["sanctioned", "protected", "approved"][appNumber % 3],
    securityScore: 8 + (appNumber % 3),
    complianceScore: 8 + (appNumber % 3),
    users: 100 + ((appNumber * 47) % 5000),
    owner: `${vendor} Admin Team`,
    administrator: `admin@${vendor.toLowerCase()}.com`,
    accessMethod: appNumber % 2 === 0 ? "SSO" : "Direct Login",
    installationType: appNumber % 3 === 0 ? "Desktop Application" : "Web Application",
    logoUrl: `/placeholder.svg?height=80&width=80&text=${vendor.charAt(0)}`,
    lastUpdated: new Date(Date.now() - ((appNumber * 86400000) % (365 * 86400000))).toISOString(),
    version: `${(appNumber % 10) + 1}.${(appNumber % 5) + 1}.${appNumber % 10}`,

    // General Information
    general: {
      category,
      headquarters: `${vendor} Headquarters, USA`,
      dataCenter: ["US-East", "US-West", "EU-Central", "Asia-Pacific"][appNumber % 4],
      hostingCompany: ["AWS", "Azure", "Google Cloud", "Self-hosted"][appNumber % 4],
      founded: 2000 + (appNumber % 24),
      holding: `${vendor} Corporation`,
      domain: `${vendor.toLowerCase()}.com`,
      termsOfService: `https://${vendor.toLowerCase()}.com/terms`,
      domainRegistration: new Date(2000 + (appNumber % 24), 0, 1).toISOString(),
      consumerPopularity: ["High", "Medium", "Low"][appNumber % 3],
      privacyPolicy: `https://${vendor.toLowerCase()}.com/privacy`,
      logonUrl: `https://app.${vendor.toLowerCase()}.com/login`,
      dataTypes: ["Personal Data", "Business Data", "Analytics Data", "System Logs"],
      disasterRecoveryPlan: appNumber % 2 === 0 ? "Available" : "In Development",
    },

    // Security Information
    security: {
      latestBreach: appNumber % 10 === 0 ? "2023-01-15" : "None reported",
      dataAtRestEncryption: "AES-256",
      multiFactorAuth: appNumber % 3 !== 0,
      userAuditTrail: true,
      dataAuditTrail: appNumber % 2 === 0,
      dataClassification: appNumber % 2 === 0,
      userRolesSupport: true,
      validCertificateName: `*.${vendor.toLowerCase()}.com`,
      encryptionProtocol: "TLS 1.3",
      httpSecurityHeaders: appNumber % 3 === 0,
      protectedAgainstDrown: true,
      requiresUserAuth: true,
      passwordPolicy: appNumber % 2 === 0,
      ipAddressRestriction: appNumber % 4 === 0,
      adminAuditTrail: true,
      userCanUploadData: appNumber % 3 !== 0,
      rememberPassword: appNumber % 2 === 0,
      fileSharing: appNumber % 3 === 0,
      trustedCertificate: true,
      heartbleedPatched: true,
      supportsSaml: appNumber % 2 === 0,
      penetrationTesting: appNumber % 3 === 0 ? "Annual" : "Bi-annual",
    },

    // Compliance Information
    compliance: {
      iso27001: appNumber % 2 === 0,
      iso27017: appNumber % 3 === 0,
      finra: appNumber % 5 === 0,
      gaap: appNumber % 4 === 0,
      isae3402: appNumber % 3 === 0,
      soc1: appNumber % 2 === 0,
      soc2: appNumber % 2 === 0,
      soc3: appNumber % 4 === 0,
      sp80053: appNumber % 6 === 0,
      safeHarborGlba: appNumber % 5 === 0,
      csaStarLevel: appNumber % 3 === 0 ? "Level 2" : "Level 1",
      ffiec: appNumber % 7 === 0,
      cobit: appNumber % 4 === 0,
      ferpa: appNumber % 8 === 0,
      jerichoForum: appNumber % 9 === 0,
      iso27018: appNumber % 3 === 0,
      iso27002: appNumber % 2 === 0,
      fisma: appNumber % 6 === 0,
      hipaa: appNumber % 10 === 0,
      itar: appNumber % 15 === 0,
      ssae18: appNumber % 4 === 0,
      pciDssVersion: appNumber % 5 === 0 ? "v4.0" : "v3.2.1",
      fedRampLevel: appNumber % 8 === 0 ? "High" : appNumber % 4 === 0 ? "Moderate" : "Low",
      privacyShield: appNumber % 6 === 0,
      gapp: appNumber % 5 === 0,
      copra: appNumber % 7 === 0,
      hitrustCsf: appNumber % 9 === 0,
    },

    // Legal Information
    legal: {
      dataOwnership: "Customer retains full ownership",
      dmca: appNumber % 2 === 0,
      dataRetentionPolicy: `${(appNumber % 7) + 1} years`,
      gdprReadiness: appNumber % 2 === 0,
      gdprRightToErasure: appNumber % 2 === 0,
      gdprReportBreaches: appNumber % 2 === 0,
      gdprDataProtection: appNumber % 2 === 0,
      gdprUserOwnership: appNumber % 2 === 0,
    },
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const app = getDetailedAppData(params.id)

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    return NextResponse.json(app)
  } catch (error) {
    console.error("Error fetching app details:", error)
    return NextResponse.json({ error: "Failed to fetch app details" }, { status: 500 })
  }
}
