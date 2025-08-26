import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Users, Calendar, FileText, Mail, Phone, CheckCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// Sample committee data - in a real app, this would come from a database
const committeeData = {
  "it-steering": {
    name: "IT Steering Committee",
    purpose: "Provide strategic direction and oversight for all ICT initiatives and investments",
    mandate:
      "The IT Steering Committee is responsible for ensuring that information technology investments align with business objectives and deliver measurable value to the organization. The committee oversees the ICT portfolio, approves major technology initiatives, and ensures effective governance of IT resources.",
    chairperson: {
      name: "Sarah Johnson",
      title: "Chief Information Officer",
      email: "sarah.johnson@company.com",
      phone: "+1 (555) 123-4567",
    },
    members: [
      { name: "Michael Chen", title: "Chief Technology Officer", department: "Technology" },
      { name: "Lisa Rodriguez", title: "VP of Operations", department: "Operations" },
      { name: "David Kim", title: "Chief Financial Officer", department: "Finance" },
      { name: "Emma Thompson", title: "Head of Security", department: "Information Security" },
      { name: "James Wilson", title: "Director of Business Analysis", department: "Business Analysis" },
      { name: "Maria Garcia", title: "Head of Data Management", department: "Data & Analytics" },
      { name: "Robert Taylor", title: "VP of Human Resources", department: "Human Resources" },
    ],
    meetingSchedule: {
      frequency: "Monthly",
      dayTime: "First Tuesday of each month, 2:00 PM - 4:00 PM",
      location: "Executive Conference Room / Virtual",
      nextMeeting: "2024-02-06",
    },
    keyResponsibilities: [
      "Review and approve ICT strategy and roadmap",
      "Oversee ICT budget allocation and investment decisions",
      "Prioritize and approve major ICT projects and initiatives",
      "Monitor ICT performance against established KPIs",
      "Ensure alignment between ICT and business objectives",
      "Review and approve ICT policies and standards",
      "Oversee ICT risk management and mitigation strategies",
      "Approve vendor selections for major ICT procurements",
    ],
    recentDecisions: [
      {
        date: "2024-01-15",
        title: "Cloud Migration Strategy Approval",
        description: "Approved the 3-year cloud migration roadmap with $2.5M budget allocation",
        status: "Approved",
      },
      {
        date: "2024-01-15",
        title: "Cybersecurity Framework Update",
        description: "Endorsed the updated cybersecurity framework based on NIST 2.0",
        status: "Approved",
      },
      {
        date: "2023-12-12",
        title: "ERP System Upgrade",
        description: "Approved budget for ERP system upgrade to latest version",
        status: "Approved",
      },
    ],
  },
}

interface CommitteePageProps {
  params: {
    committee: string
  }
}

export default function CommitteePage({ params }: CommitteePageProps) {
  const committee = committeeData[params.committee as keyof typeof committeeData]

  if (!committee) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/structure">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Governance Structure
            </Link>
          </Button>
          <h1 className="font-heading text-4xl font-bold mb-4">{committee.name}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{committee.purpose}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mandate */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Committee Mandate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{committee.mandate}</p>
              </CardContent>
            </Card>

            {/* Key Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {committee.keyResponsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recent Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Recent Decisions</CardTitle>
                <CardDescription>Key decisions made by the committee in recent meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {committee.recentDecisions.map((decision, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{decision.title}</h4>
                        <Badge variant="secondary">{decision.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{decision.description}</p>
                      <p className="text-xs text-muted-foreground">{decision.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chairperson */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Committee Chair</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {committee.chairperson.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{committee.chairperson.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{committee.chairperson.title}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${committee.chairperson.email}`} className="text-primary hover:underline">
                          {committee.chairperson.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{committee.chairperson.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Meeting Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{committee.meetingSchedule.frequency}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Schedule:</p>
                  <p className="text-sm">{committee.meetingSchedule.dayTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location:</p>
                  <p className="text-sm">{committee.meetingSchedule.location}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Next Meeting:</p>
                  <p className="text-sm font-medium">{committee.meetingSchedule.nextMeeting}</p>
                </div>
              </CardContent>
            </Card>

            {/* Committee Members */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Committee Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {committee.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Meeting Minutes
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="mr-2 h-4 w-4" />
                  Meeting Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Committee
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
