import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, User, ChevronRight, Shield, Cog } from "lucide-react"
import Link from "next/link"

const documentCategories = [
  {
    id: "policies",
    name: "Policies",
    description: "High-level governance policies that define organizational principles and requirements",
    icon: Shield,
    color: "bg-primary/10 text-primary",
    count: 12,
  },
  {
    id: "standards",
    name: "Standards",
    description: "Mandatory technical and operational standards for consistent implementation",
    icon: Cog,
    color: "bg-accent/10 text-accent",
    count: 18,
  },
  {
    id: "procedures",
    name: "Procedures",
    description: "Step-by-step instructions for carrying out specific governance processes",
    icon: FileText,
    color: "bg-chart-2/10 text-chart-2",
    count: 24,
  },
]

const featuredDocuments = [
  {
    id: "info-security-policy",
    title: "Information Security Policy",
    type: "Policy",
    version: "v2.1",
    lastUpdated: "2024-01-15",
    owner: "Chief Information Security Officer",
    description:
      "Comprehensive policy governing information security practices and requirements across the organization.",
    status: "Active",
    category: "policies",
  },
  {
    id: "data-governance-policy",
    title: "Data Governance Policy",
    type: "Policy",
    version: "v1.3",
    lastUpdated: "2024-01-10",
    owner: "Chief Data Officer",
    description:
      "Framework for managing data as a strategic asset including quality, privacy, and lifecycle management.",
    status: "Active",
    category: "policies",
  },
  {
    id: "password-standard",
    title: "Password Security Standard",
    type: "Standard",
    version: "v3.0",
    lastUpdated: "2024-01-08",
    owner: "Information Security Team",
    description: "Technical requirements for password complexity, rotation, and management across all systems.",
    status: "Active",
    category: "standards",
  },
  {
    id: "incident-response-procedure",
    title: "Security Incident Response Procedure",
    type: "Procedure",
    version: "v2.2",
    lastUpdated: "2024-01-12",
    owner: "Security Operations Center",
    description: "Step-by-step process for identifying, containing, and resolving security incidents.",
    status: "Active",
    category: "procedures",
  },
]

const recentUpdates = [
  {
    title: "Information Security Policy v2.1",
    type: "Policy Update",
    date: "2024-01-15",
    description: "Updated to include new remote work security requirements",
  },
  {
    title: "Cloud Security Standard v1.2",
    type: "New Standard",
    date: "2024-01-12",
    description: "New standard for cloud service security configurations",
  },
  {
    title: "Data Backup Procedure v3.1",
    type: "Procedure Update",
    date: "2024-01-10",
    description: "Enhanced backup verification and recovery testing procedures",
  },
]

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold mb-4">Policies, Standards & Procedures</h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Your central repository for all ICT governance documentation. Access policies, standards, and procedures
            that guide our technology operations and decision-making.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-10" />
          </div>
        </div>

        {/* Document Categories */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Document Categories</h2>
            <p className="text-muted-foreground text-lg">
              Browse our governance documentation organized by type and purpose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {documentCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary">{category.count} documents</Badge>
                    </div>
                    <CardTitle className="font-heading text-xl">{category.name}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="ghost" className="w-full justify-between p-0 h-auto">
                      <Link href={`/documents/${category.id}`} className="text-primary hover:text-primary/80">
                        Browse {category.name}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Featured Documents */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Featured Documents</h2>
            <p className="text-muted-foreground text-lg">
              Key governance documents that are frequently accessed and recently updated.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{doc.type}</Badge>
                      <Badge variant="secondary">{doc.version}</Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{doc.status}</Badge>
                  </div>
                  <CardTitle className="font-heading text-lg">{doc.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Owner: {doc.owner}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last updated: {doc.lastUpdated}</span>
                    </div>
                  </div>
                  <Button asChild variant="ghost" className="w-full justify-between p-0 h-auto">
                    <Link href={`/documents/${doc.category}/${doc.id}`} className="text-primary hover:text-primary/80">
                      View Document
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Updates */}
        <section>
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Recent Updates</h2>
            <p className="text-muted-foreground text-lg">
              Stay informed about the latest changes to our governance documentation.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Latest Document Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="flex items-start justify-between py-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{update.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {update.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{update.description}</p>
                      <p className="text-xs text-muted-foreground">{update.date}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
