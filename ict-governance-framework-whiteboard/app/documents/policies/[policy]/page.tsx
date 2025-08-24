import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, User, FileText, Download, Share, AlertCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// Sample policy data - in a real app, this would come from a database
const policyData = {
  "info-security-policy": {
    title: "Information Security Policy",
    version: "v2.1",
    lastUpdated: "2024-01-15",
    nextReview: "2024-07-15",
    owner: "Chief Information Security Officer",
    approver: "Chief Executive Officer",
    status: "Active",
    category: "Security",
    priority: "Critical",
    purpose:
      "This policy establishes the framework for protecting the organization's information assets and ensuring the confidentiality, integrity, and availability of information systems and data.",
    scope:
      "This policy applies to all employees, contractors, consultants, temporary staff, and other workers at the organization, including all personnel affiliated with third parties who have access to organizational information systems and data.",
    policyStatements: [
      {
        section: "Information Classification",
        content:
          "All information assets must be classified according to their sensitivity and criticality. Classification levels include Public, Internal, Confidential, and Restricted. Each classification level has specific handling, storage, and transmission requirements.",
      },
      {
        section: "Access Control",
        content:
          "Access to information systems and data must be granted based on the principle of least privilege. User access rights must be regularly reviewed and updated. Multi-factor authentication is required for all privileged accounts and remote access.",
      },
      {
        section: "Incident Response",
        content:
          "All security incidents must be reported immediately to the Security Operations Center. The organization maintains a formal incident response plan that includes procedures for containment, investigation, and recovery.",
      },
      {
        section: "Risk Management",
        content:
          "Regular security risk assessments must be conducted to identify, evaluate, and mitigate information security risks. Risk treatment plans must be developed and implemented for all identified high and critical risks.",
      },
      {
        section: "Compliance and Monitoring",
        content:
          "Compliance with this policy is mandatory and will be monitored through regular audits and assessments. Non-compliance may result in disciplinary action up to and including termination of employment.",
      },
    ],
    relatedDocuments: [
      { title: "Password Security Standard", type: "Standard", href: "/documents/standards/password-standard" },
      { title: "Incident Response Procedure", type: "Procedure", href: "/documents/procedures/incident-response" },
      { title: "Data Classification Standard", type: "Standard", href: "/documents/standards/data-classification" },
      { title: "Access Control Procedure", type: "Procedure", href: "/documents/procedures/access-control" },
    ],
    revisionHistory: [
      { version: "v2.1", date: "2024-01-15", changes: "Added remote work security requirements" },
      { version: "v2.0", date: "2023-07-15", changes: "Major revision to align with new regulatory requirements" },
      { version: "v1.9", date: "2023-01-10", changes: "Updated incident response procedures" },
    ],
  },
}

interface PolicyPageProps {
  params: {
    policy: string
  }
}

export default function PolicyPage({ params }: PolicyPageProps) {
  const policy = policyData[params.policy as keyof typeof policyData]

  if (!policy) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/documents/policies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Policies
            </Link>
          </Button>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{policy.category}</Badge>
                <Badge variant="secondary">{policy.version}</Badge>
                <Badge
                  className={
                    policy.priority === "Critical"
                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                      : policy.priority === "High"
                        ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  }
                >
                  {policy.priority}
                </Badge>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{policy.status}</Badge>
              </div>
              <h1 className="font-heading text-4xl font-bold mb-2">{policy.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Policy Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Policy Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Purpose</h3>
                  <p className="text-muted-foreground leading-relaxed">{policy.purpose}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Scope</h3>
                  <p className="text-muted-foreground leading-relaxed">{policy.scope}</p>
                </div>
              </CardContent>
            </Card>

            {/* Policy Statements */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Policy Statements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {policy.policyStatements.map((statement, index) => (
                    <div key={index}>
                      <h3 className="font-medium mb-3 text-lg">{statement.section}</h3>
                      <p className="text-muted-foreground leading-relaxed">{statement.content}</p>
                      {index < policy.policyStatements.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Related Documents</CardTitle>
                <CardDescription>Standards and procedures that support this policy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policy.relatedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={doc.href}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Policy Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Policy Owner</p>
                    <p className="font-medium">{policy.owner}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Approved By</p>
                    <p className="font-medium">{policy.approver}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{policy.lastUpdated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Next Review</p>
                    <p className="font-medium">{policy.nextReview}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Notice */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Review Due Soon</p>
                    <p className="text-xs text-orange-700 mt-1">
                      This policy is scheduled for review on {policy.nextReview}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revision History */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Revision History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policy.revisionHistory.map((revision, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{revision.version}</span>
                        <span className="text-muted-foreground">{revision.date}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">{revision.changes}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
