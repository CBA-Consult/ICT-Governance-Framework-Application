import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, Calendar, FileText, ChevronRight, Building2, Shield, Cog, Database, Lock } from "lucide-react"
import Link from "next/link"

const governanceHierarchy = [
  {
    level: 1,
    title: "Board of Directors",
    description: "Ultimate accountability for ICT governance and strategic oversight",
    icon: Building2,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    level: 2,
    title: "Executive Management",
    description: "Strategic direction and resource allocation for ICT initiatives",
    icon: Users,
    color: "bg-accent/10 text-accent border-accent/20",
  },
  {
    level: 3,
    title: "IT Steering Committee",
    description: "Operational oversight and decision-making for ICT projects",
    icon: Shield,
    color: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  {
    level: 4,
    title: "Specialized Committees",
    description: "Domain-specific governance and technical oversight",
    icon: Cog,
    color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
]

const committees = [
  {
    id: "it-steering",
    name: "IT Steering Committee",
    purpose: "Provide strategic direction and oversight for all ICT initiatives and investments",
    chairperson: "Chief Information Officer",
    members: 8,
    meetingFrequency: "Monthly",
    lastMeeting: "2024-01-15",
    keyResponsibilities: [
      "ICT strategy approval and alignment",
      "Budget allocation and investment decisions",
      "Project portfolio prioritization",
      "Risk oversight and mitigation",
      "Performance monitoring and reporting",
    ],
    icon: Shield,
  },
  {
    id: "architecture-review",
    name: "Architecture Review Board",
    purpose: "Ensure technical architecture standards and design principles are maintained",
    chairperson: "Chief Technology Officer",
    members: 6,
    meetingFrequency: "Bi-weekly",
    lastMeeting: "2024-01-18",
    keyResponsibilities: [
      "Architecture standards definition",
      "Design review and approval",
      "Technology stack governance",
      "Integration pattern oversight",
      "Technical debt management",
    ],
    icon: Cog,
  },
  {
    id: "data-governance",
    name: "Data Governance Committee",
    purpose: "Oversee data management, quality, and compliance across the organization",
    chairperson: "Chief Data Officer",
    members: 7,
    meetingFrequency: "Monthly",
    lastMeeting: "2024-01-12",
    keyResponsibilities: [
      "Data quality standards",
      "Data privacy and compliance",
      "Master data management",
      "Data lifecycle governance",
      "Analytics and reporting oversight",
    ],
    icon: Database,
  },
  {
    id: "security-committee",
    name: "Information Security Committee",
    purpose: "Ensure comprehensive information security governance and risk management",
    chairperson: "Chief Information Security Officer",
    members: 5,
    meetingFrequency: "Monthly",
    lastMeeting: "2024-01-20",
    keyResponsibilities: [
      "Security policy development",
      "Incident response coordination",
      "Compliance monitoring",
      "Security awareness programs",
      "Vendor security assessments",
    ],
    icon: Lock,
  },
]

export default function GovernanceStructurePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold mb-4">Governance Structure</h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Our ICT governance structure ensures clear accountability, effective decision-making, and strategic
            alignment across all technology initiatives.
          </p>
        </div>

        {/* Organizational Hierarchy */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Governance Hierarchy</h2>
            <p className="text-muted-foreground text-lg">
              The decision-making structure flows from strategic oversight to operational execution.
            </p>
          </div>

          <div className="space-y-6">
            {governanceHierarchy.map((level, index) => {
              const Icon = level.icon
              return (
                <div key={index} className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full border-2 ${level.color} flex items-center justify-center`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-heading text-xl">{level.title}</CardTitle>
                        <Badge variant="outline">Level {level.level}</Badge>
                      </div>
                      <CardDescription className="text-base">{level.description}</CardDescription>
                    </CardHeader>
                  </Card>
                  {index < governanceHierarchy.length - 1 && (
                    <div className="flex-shrink-0 ml-8">
                      <ChevronRight className="h-6 w-6 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <Separator className="my-16" />

        {/* Committee Profiles */}
        <section>
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Committee Profiles</h2>
            <p className="text-muted-foreground text-lg">
              Detailed information about each governance committee, their responsibilities, and meeting schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {committees.map((committee) => {
              const Icon = committee.icon
              return (
                <Card key={committee.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="font-heading text-lg">{committee.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">Chair: {committee.chairperson}</p>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-base leading-relaxed">{committee.purpose}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Meeting Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{committee.members} Members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{committee.meetingFrequency}</span>
                      </div>
                    </div>

                    {/* Key Responsibilities */}
                    <div>
                      <h4 className="font-medium mb-3">Key Responsibilities</h4>
                      <ul className="space-y-2">
                        {committee.keyResponsibilities.slice(0, 3).map((responsibility, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {responsibility}
                          </li>
                        ))}
                        {committee.keyResponsibilities.length > 3 && (
                          <li className="text-sm text-muted-foreground">
                            +{committee.keyResponsibilities.length - 3} more responsibilities
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Last meeting: {committee.lastMeeting}
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/structure/${committee.id}`}>
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <Card className="bg-muted/50">
            <CardContent className="py-8">
              <h3 className="font-heading text-2xl font-bold mb-4">Need More Information?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                For detailed committee charters, meeting minutes, or to request participation in governance activities,
                please contact our governance team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/contact">Contact Governance Team</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/roles">View Roles & Responsibilities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
