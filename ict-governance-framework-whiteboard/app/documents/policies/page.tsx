import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Calendar, User, ChevronRight, Shield } from "lucide-react"
import Link from "next/link"

const policies = [
  {
    id: "info-security-policy",
    title: "Information Security Policy",
    version: "v2.1",
    lastUpdated: "2024-01-15",
    owner: "Chief Information Security Officer",
    description:
      "Comprehensive policy governing information security practices and requirements across the organization.",
    status: "Active",
    category: "Security",
    priority: "Critical",
  },
  {
    id: "data-governance-policy",
    title: "Data Governance Policy",
    version: "v1.3",
    lastUpdated: "2024-01-10",
    owner: "Chief Data Officer",
    description:
      "Framework for managing data as a strategic asset including quality, privacy, and lifecycle management.",
    status: "Active",
    category: "Data Management",
    priority: "High",
  },
  {
    id: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    version: "v3.2",
    lastUpdated: "2023-12-20",
    owner: "Human Resources Director",
    description: "Guidelines for appropriate use of organizational ICT resources by employees and contractors.",
    status: "Active",
    category: "Usage",
    priority: "High",
  },
  {
    id: "business-continuity-policy",
    title: "Business Continuity Policy",
    version: "v2.0",
    lastUpdated: "2023-11-15",
    owner: "Chief Risk Officer",
    description: "Policy framework for maintaining critical business operations during disruptions and disasters.",
    status: "Active",
    category: "Risk Management",
    priority: "Critical",
  },
  {
    id: "privacy-policy",
    title: "Privacy and Data Protection Policy",
    version: "v1.8",
    lastUpdated: "2023-10-30",
    owner: "Data Protection Officer",
    description: "Comprehensive policy for protecting personal data and ensuring compliance with privacy regulations.",
    status: "Active",
    category: "Privacy",
    priority: "Critical",
  },
  {
    id: "change-management-policy",
    title: "ICT Change Management Policy",
    version: "v2.5",
    lastUpdated: "2023-09-25",
    owner: "Change Management Board",
    description: "Policy governing the process for implementing changes to ICT systems and infrastructure.",
    status: "Active",
    category: "Change Management",
    priority: "Medium",
  },
]

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-4xl font-bold">ICT Policies</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            High-level governance policies that define organizational principles and requirements for ICT operations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search policies..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="data">Data Management</SelectItem>
              <SelectItem value="risk">Risk Management</SelectItem>
              <SelectItem value="privacy">Privacy</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Policies List */}
        <div className="space-y-4">
          {policies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{policy.status}</Badge>
                </div>
                <CardTitle className="font-heading text-xl">{policy.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{policy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Owner: {policy.owner}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last updated: {policy.lastUpdated}</span>
                    </div>
                  </div>
                  <Button asChild variant="ghost">
                    <Link href={`/documents/policies/${policy.id}`}>
                      View Policy
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{policies.length}</div>
              <div className="text-sm text-muted-foreground">Total Policies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {policies.filter((p) => p.priority === "Critical").length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {policies.filter((p) => p.status === "Active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active Policies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {policies.filter((p) => new Date(p.lastUpdated) > new Date("2024-01-01")).length}
              </div>
              <div className="text-sm text-muted-foreground">Updated This Year</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
