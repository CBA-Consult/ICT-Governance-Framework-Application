"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Globe,
  Users,
  Star,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Building,
  Server,
  Lock,
  Eye,
  FileText,
  Award,
  ArrowLeft,
  Scale,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Comprehensive app data with all required fields
const appDetails = {
  "microsoft-365": {
    id: "microsoft-365",
    name: "Microsoft 365",
    category: "Productivity",
    description: "Complete productivity suite with Word, Excel, PowerPoint, and Teams",
    owner: "IT Department",
    administrator: "John Smith (john.smith@company.com)",
    type: "web",
    securityScore: 95,
    complianceScore: 98,
    popularity: 4.8,
    users: 1250,
    status: "approved",
    accessMethod: "SSO Login",
    logo: "/microsoft-365-logo.png",

    // General Information
    general: {
      category: "Productivity Suite",
      headquarters: "Redmond, Washington, USA",
      dataCenter: "Microsoft Azure Global",
      hostingCompany: "Microsoft Corporation",
      founded: "2011",
      holding: "Microsoft Corporation",
      domain: "office.com, microsoft.com",
      termsOfService: "https://www.microsoft.com/servicesagreement",
      domainRegistration: "1991-05-02",
      consumerPopularity: "Very High - 345M+ users worldwide",
      privacyPolicy: "https://privacy.microsoft.com/privacystatement",
      logonUrl: "https://login.microsoftonline.com",
      vendor: "Microsoft Corporation",
      dataTypes: "Documents, Emails, Calendar, Contacts, Files",
      disasterRecoveryPlan: "Multi-region backup with 99.9% uptime SLA",
    },

    // Security Information
    security: {
      latestBreach: "No major breaches reported in last 5 years",
      dataAtRestEncryption: "AES-256 encryption",
      multiFactorAuth: true,
      userAuditTrail: true,
      dataAuditTrail: true,
      dataClassification: "Confidential, Internal, Public",
      userRolesSupport: true,
      validCertificateName: "*.office.com, *.microsoft.com",
      encryptionProtocol: "TLS 1.3",
      httpSecurityHeaders: true,
      protectedAgainstDrown: true,
      requiresUserAuth: true,
      passwordPolicy: "Complex passwords with MFA required",
      ipAddressRestriction: true,
      adminAuditTrail: true,
      userCanUploadData: true,
      rememberPassword: false,
      fileSharing: true,
      trustedCertificate: true,
      heartbleedPatched: true,
      supportsSaml: true,
      penetrationTesting: "Annual third-party testing",
    },

    // Compliance Information
    compliance: {
      iso27001: true,
      iso27017: true,
      iso27018: true,
      iso27002: true,
      finra: true,
      gaap: true,
      isae3402: true,
      soc1: true,
      soc2: true,
      soc3: true,
      sp80053: true,
      ssae18: true,
      safeHarborGlba: true,
      csaStarLevel: "Gold",
      ffiec: true,
      cobit: true,
      ferpa: true,
      jerichoForumCommandments: false,
      fisma: true,
      hipaa: false,
      itar: false,
      pciDssVersion: "4.0",
      fedRampLevel: "Moderate",
      privacyShield: false,
      gapp: true,
      copra: true,
      hitrustCsf: false,
    },

    // Legal Information
    legal: {
      dataOwnership: "Customer retains full ownership of all data",
      dmca: "DMCA compliant with takedown procedures",
      dataRetentionPolicy: "Data retained per customer configuration, minimum 30 days",
      gdprReadinessStatement: "Fully GDPR compliant with comprehensive data protection measures",
      gdprRightToErasure: "Complete data deletion within 30 days of request",
      gdprReportDataBreaches: "Breach notification within 72 hours to authorities and affected users",
      gdprDataProtection: "Data Protection Officer appointed, privacy by design implemented",
      gdprUserOwnership: "Users have full control over their personal data and processing consent",
    },
  },

  slack: {
    id: "slack",
    name: "Slack",
    category: "Communication",
    description: "Team collaboration and messaging platform",
    owner: "HR Department",
    administrator: "Sarah Johnson (sarah.j@company.com)",
    type: "web",
    securityScore: 88,
    complianceScore: 85,
    popularity: 4.6,
    users: 890,
    status: "approved",
    accessMethod: "Request Access",
    logo: "/slack-logo.png",

    // General Information
    general: {
      category: "Team Communication",
      headquarters: "San Francisco, California, USA",
      dataCenter: "AWS Multi-Region",
      hostingCompany: "Amazon Web Services",
      founded: "2009",
      holding: "Salesforce, Inc.",
      domain: "slack.com",
      termsOfService: "https://slack.com/terms-of-service",
      domainRegistration: "2009-02-11",
      consumerPopularity: "High - 18M+ daily active users",
      privacyPolicy: "https://slack.com/privacy-policy",
      logonUrl: "https://company.slack.com",
      vendor: "Slack Technologies, LLC",
      dataTypes: "Messages, Files, User profiles, Channel data",
      disasterRecoveryPlan: "Multi-AZ deployment with automated failover",
    },

    // Security Information
    security: {
      latestBreach: "2015 - Database intrusion (resolved)",
      dataAtRestEncryption: "AES-256 encryption",
      multiFactorAuth: true,
      userAuditTrail: true,
      dataAuditTrail: true,
      dataClassification: "Public, Internal, Confidential",
      userRolesSupport: true,
      validCertificateName: "*.slack.com",
      encryptionProtocol: "TLS 1.3",
      httpSecurityHeaders: true,
      protectedAgainstDrown: true,
      requiresUserAuth: true,
      passwordPolicy: "Strong passwords with optional MFA",
      ipAddressRestriction: true,
      adminAuditTrail: true,
      userCanUploadData: true,
      rememberPassword: true,
      fileSharing: true,
      trustedCertificate: true,
      heartbleedPatched: true,
      supportsSaml: true,
      penetrationTesting: "Continuous security testing",
    },

    // Compliance Information
    compliance: {
      iso27001: true,
      iso27017: false,
      iso27018: true,
      iso27002: true,
      finra: true,
      gaap: false,
      isae3402: true,
      soc1: true,
      soc2: true,
      soc3: true,
      sp80053: false,
      ssae18: true,
      safeHarborGlba: false,
      csaStarLevel: "Silver",
      ffiec: false,
      cobit: false,
      ferpa: true,
      jerichoForumCommandments: false,
      fisma: false,
      hipaa: true,
      itar: false,
      pciDssVersion: "Not Applicable",
      fedRampLevel: "Not Certified",
      privacyShield: false,
      gapp: false,
      copra: true,
      hitrustCsf: false,
    },

    // Legal Information
    legal: {
      dataOwnership: "Customer owns data, Slack has limited processing rights",
      dmca: "DMCA compliant with automated content scanning",
      dataRetentionPolicy: "Configurable retention from 1 day to indefinite",
      gdprReadinessStatement: "GDPR compliant with EU data residency options",
      gdprRightToErasure: "Data deletion within 30 days, some metadata may persist",
      gdprReportDataBreaches: "Breach notification within 72 hours per GDPR requirements",
      gdprDataProtection: "Privacy by design, regular privacy impact assessments",
      gdprUserOwnership: "Individual users can export and delete their personal data",
    },
  },
}

const getComplianceIcon = (compliant: boolean) => {
  return compliant ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
}

const getSecurityIcon = (secure: boolean | string) => {
  if (typeof secure === "boolean") {
    return secure ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }
  return <Eye className="h-4 w-4 text-blue-600" />
}

export default function AppDetailPage() {
  const params = useParams()
  const appId = params.id as string
  const app = appDetails[appId as keyof typeof appDetails]

  if (!app) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
          <Button asChild>
            <Link href="/app-store">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App Store
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const getSecurityBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (score >= 80) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/app-store">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App Store
          </Link>
        </Button>

        <div className="flex items-start gap-6">
          <img src={app.logo || "/placeholder.svg"} alt={`${app.name} logo`} className="w-20 h-20 rounded-xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-4xl font-bold mb-2">{app.name}</h1>
                <p className="text-lg text-muted-foreground mb-4">{app.description}</p>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{app.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{app.popularity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{app.users} users</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button>
                  {app.type === "web" ? (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {app.accessMethod}
                </Button>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Owner: {app.owner}</div>
                  <div className="text-sm text-muted-foreground">Admin: {app.administrator}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{app.securityScore}/100</div>
                  <div className="text-sm text-muted-foreground">Security Score</div>
                </div>
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{app.complianceScore}/100</div>
                  <div className="text-sm text-muted-foreground">Compliance Score</div>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{app.users}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="security">Security Details</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Certifications</TabsTrigger>
          <TabsTrigger value="legal">Legal Information</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Information
              </CardTitle>
              <CardDescription>Basic information about the application and vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Headquarters</div>
                      <div className="text-sm text-muted-foreground">{app.general.headquarters}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Data Center</div>
                      <div className="text-sm text-muted-foreground">{app.general.dataCenter}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Hosting Company</div>
                      <div className="text-sm text-muted-foreground">{app.general.hostingCompany}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Founded</div>
                      <div className="text-sm text-muted-foreground">{app.general.founded}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Parent Company</div>
                      <div className="text-sm text-muted-foreground">{app.general.holding}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Domain</div>
                      <div className="text-sm text-muted-foreground">{app.general.domain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Consumer Popularity</div>
                      <div className="text-sm text-muted-foreground">{app.general.consumerPopularity}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Login URL</div>
                      <a href={app.general.logonUrl} className="text-sm text-primary hover:underline">
                        {app.general.logonUrl}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Data Types</div>
                      <div className="text-sm text-muted-foreground">{app.general.dataTypes}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Disaster Recovery</div>
                      <div className="text-sm text-muted-foreground">{app.general.disasterRecoveryPlan}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium">Legal Documents</h4>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.general.termsOfService} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Terms of Service
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.general.privacyPolicy} target="_blank" rel="noopener noreferrer">
                      <Lock className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Assessment
              </CardTitle>
              <CardDescription>Comprehensive security analysis and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Multi-Factor Authentication</span>
                    {getSecurityIcon(app.security.multiFactorAuth)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Data-at-Rest Encryption</span>
                    <span className="text-sm text-muted-foreground">{app.security.dataAtRestEncryption}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User Audit Trail</span>
                    {getSecurityIcon(app.security.userAuditTrail)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Data Audit Trail</span>
                    {getSecurityIcon(app.security.dataAuditTrail)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User Roles Support</span>
                    {getSecurityIcon(app.security.userRolesSupport)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Encryption Protocol</span>
                    <span className="text-sm text-muted-foreground">{app.security.encryptionProtocol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">HTTP Security Headers</span>
                    {getSecurityIcon(app.security.httpSecurityHeaders)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Protected Against DROWN</span>
                    {getSecurityIcon(app.security.protectedAgainstDrown)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Requires User Authentication</span>
                    {getSecurityIcon(app.security.requiresUserAuth)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">IP Address Restriction</span>
                    {getSecurityIcon(app.security.ipAddressRestriction)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Admin Audit Trail</span>
                    {getSecurityIcon(app.security.adminAuditTrail)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User Can Upload Data</span>
                    {getSecurityIcon(app.security.userCanUploadData)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Remember Password</span>
                    {getSecurityIcon(app.security.rememberPassword)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">File Sharing</span>
                    {getSecurityIcon(app.security.fileSharing)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Trusted Certificate</span>
                    {getSecurityIcon(app.security.trustedCertificate)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Heartbleed Patched</span>
                    {getSecurityIcon(app.security.heartbleedPatched)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Supports SAML</span>
                    {getSecurityIcon(app.security.supportsSaml)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Data Classification</span>
                    <span className="text-sm text-muted-foreground">{app.security.dataClassification}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Password Policy</span>
                    <span className="text-sm text-muted-foreground">{app.security.passwordPolicy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Penetration Testing</span>
                    <span className="text-sm text-muted-foreground">{app.security.penetrationTesting}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium">Security Incidents</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Latest Security Breach</div>
                      <div className="text-sm text-muted-foreground">{app.security.latestBreach}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Compliance & Certifications
              </CardTitle>
              <CardDescription>Industry standards and regulatory compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">ISO Standards</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ISO 27001</span>
                    {getComplianceIcon(app.compliance.iso27001)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ISO 27017</span>
                    {getComplianceIcon(app.compliance.iso27017)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ISO 27018</span>
                    {getComplianceIcon(app.compliance.iso27018)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ISO 27002</span>
                    {getComplianceIcon(app.compliance.iso27002)}
                  </div>

                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">
                    Financial Standards
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FINRA</span>
                    {getComplianceIcon(app.compliance.finra)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GAAP</span>
                    {getComplianceIcon(app.compliance.gaap)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GAPP</span>
                    {getComplianceIcon(app.compliance.gapp)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FFIEC</span>
                    {getComplianceIcon(app.compliance.ffiec)}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    SOC & Audit Standards
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SOC 1</span>
                    {getComplianceIcon(app.compliance.soc1)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SOC 2</span>
                    {getComplianceIcon(app.compliance.soc2)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SOC 3</span>
                    {getComplianceIcon(app.compliance.soc3)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ISAE 3402</span>
                    {getComplianceIcon(app.compliance.isae3402)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SSAE 18</span>
                    {getComplianceIcon(app.compliance.ssae18)}
                  </div>

                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">
                    Healthcare & Education
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">HIPAA</span>
                    {getComplianceIcon(app.compliance.hipaa)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FERPA</span>
                    {getComplianceIcon(app.compliance.ferpa)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">HITRUST CSF</span>
                    {getComplianceIcon(app.compliance.hitrustCsf)}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Government & Security
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FISMA</span>
                    {getComplianceIcon(app.compliance.fisma)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">SP 800-53</span>
                    {getComplianceIcon(app.compliance.sp80053)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ITAR</span>
                    {getComplianceIcon(app.compliance.itar)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FedRAMP Level</span>
                    <span className="text-sm text-muted-foreground">{app.compliance.fedRampLevel}</span>
                  </div>

                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">
                    Other Standards
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">PCI DSS</span>
                    <span className="text-sm text-muted-foreground">{app.compliance.pciDssVersion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">CSA STAR Level</span>
                    <span className="text-sm text-muted-foreground">{app.compliance.csaStarLevel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">COBIT</span>
                    {getComplianceIcon(app.compliance.cobit)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">COPRA</span>
                    {getComplianceIcon(app.compliance.copra)}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium">Compliance Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.values(app.compliance).filter((v) => v === true).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Compliant Standards</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {Object.values(app.compliance).filter((v) => v === false).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Non-Compliant</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{app.complianceScore}%</div>
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Legal Information
              </CardTitle>
              <CardDescription>Data protection, privacy, and legal compliance details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                    Data Ownership & Rights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-1">Data Ownership</div>
                        <div className="text-sm text-muted-foreground">{app.legal.dataOwnership}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">DMCA Compliance</div>
                        <div className="text-sm text-muted-foreground">{app.legal.dmca}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-1">Data Retention Policy</div>
                        <div className="text-sm text-muted-foreground">{app.legal.dataRetentionPolicy}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                    GDPR Compliance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-1">GDPR Readiness Statement</div>
                        <div className="text-sm text-muted-foreground">{app.legal.gdprReadinessStatement}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Right to Erasure</div>
                        <div className="text-sm text-muted-foreground">{app.legal.gdprRightToErasure}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Data Breach Reporting</div>
                        <div className="text-sm text-muted-foreground">{app.legal.gdprReportDataBreaches}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-1">Data Protection Measures</div>
                        <div className="text-sm text-muted-foreground">{app.legal.gdprDataProtection}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">User Data Ownership</div>
                        <div className="text-sm text-muted-foreground">{app.legal.gdprUserOwnership}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium mb-2">Legal Compliance Summary</div>
                      <div className="text-sm text-muted-foreground">
                        This application has been reviewed for legal compliance including data protection regulations,
                        privacy requirements, and industry-specific legal obligations. All legal documentation is
                        regularly updated to reflect current regulatory requirements.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
