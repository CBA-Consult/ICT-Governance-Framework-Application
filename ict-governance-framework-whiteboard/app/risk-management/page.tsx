import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  Shield,
  Target,
  TrendingUp,
  FileText,
  Users,
  Lock,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

const riskFrameworkComponents = [
  {
    title: "Risk Identification",
    description: "Systematic process for discovering and documenting potential risks to ICT operations",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700",
    processes: ["Asset inventory", "Threat modeling", "Vulnerability assessments", "Stakeholder interviews"],
  },
  {
    title: "Risk Assessment",
    description: "Evaluation of identified risks based on likelihood and impact to determine priority",
    icon: Target,
    color: "bg-orange-100 text-orange-700",
    processes: ["Qualitative analysis", "Quantitative analysis", "Risk scoring", "Impact evaluation"],
  },
  {
    title: "Risk Treatment",
    description: "Implementation of controls and measures to mitigate, transfer, or accept risks",
    icon: Shield,
    color: "bg-blue-100 text-blue-700",
    processes: ["Control selection", "Implementation planning", "Resource allocation", "Timeline management"],
  },
  {
    title: "Risk Monitoring",
    description: "Ongoing surveillance and review of risk landscape and control effectiveness",
    icon: TrendingUp,
    color: "bg-green-100 text-green-700",
    processes: ["KRI monitoring", "Control testing", "Risk reporting", "Trend analysis"],
  },
]

const riskCategories = [
  { name: "Cybersecurity", count: 15, high: 3, medium: 8, low: 4, color: "bg-red-500" },
  { name: "Operational", count: 12, high: 2, medium: 6, low: 4, color: "bg-orange-500" },
  { name: "Compliance", count: 8, high: 1, medium: 4, low: 3, color: "bg-yellow-500" },
  { name: "Technology", count: 10, high: 2, medium: 5, low: 3, color: "bg-blue-500" },
  { name: "Third Party", count: 6, high: 1, medium: 3, low: 2, color: "bg-purple-500" },
]

const riskAppetiteStatements = [
  {
    category: "Cybersecurity",
    statement:
      "Zero tolerance for risks that could result in unauthorized access to sensitive data or critical systems",
    level: "Very Low",
    color: "bg-red-100 text-red-800",
  },
  {
    category: "Operational",
    statement: "Low tolerance for risks that could disrupt core business operations for more than 4 hours",
    level: "Low",
    color: "bg-orange-100 text-orange-800",
  },
  {
    category: "Financial",
    statement: "Moderate tolerance for risks with potential financial impact up to $100,000 annually",
    level: "Moderate",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    category: "Innovation",
    statement: "Higher tolerance for calculated risks that support digital transformation and competitive advantage",
    level: "Moderate-High",
    color: "bg-blue-100 text-blue-800",
  },
]

const recentRiskActivities = [
  {
    date: "2024-01-20",
    activity: "Quarterly Risk Assessment Completed",
    description: "Comprehensive review of all ICT risks with updated risk scores",
    type: "Assessment",
  },
  {
    date: "2024-01-18",
    activity: "New Cloud Security Controls Implemented",
    description: "Enhanced monitoring and access controls for cloud infrastructure",
    type: "Mitigation",
  },
  {
    date: "2024-01-15",
    activity: "Third-Party Risk Review",
    description: "Annual assessment of vendor security postures and contract terms",
    type: "Review",
  },
  {
    date: "2024-01-12",
    activity: "Incident Response Plan Updated",
    description: "Revised procedures based on lessons learned from recent incidents",
    type: "Update",
  },
]

export default function RiskManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Risk Management</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Our comprehensive approach to identifying, assessing, and mitigating ICT risks to protect organizational
            assets and ensure business continuity.
          </p>
        </div>

        {/* Risk Framework Overview */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Risk Management Framework</h2>
            <p className="text-muted-foreground text-lg">
              Based on ISO 31000 and NIST Risk Management Framework, our approach ensures systematic and consistent risk
              management across all ICT operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {riskFrameworkComponents.map((component, index) => {
              const Icon = component.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${component.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-heading text-lg">{component.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{component.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {component.processes.map((process, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {process}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Risk Appetite */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Risk Appetite Statement</h2>
            <p className="text-muted-foreground text-lg">
              Our organization's willingness to accept risk in pursuit of business objectives, defined by category and
              tolerance levels.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {riskAppetiteStatements.map((appetite, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="font-heading text-lg">{appetite.category}</CardTitle>
                    <Badge className={appetite.color}>{appetite.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{appetite.statement}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-16" />

        {/* Risk Dashboard */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Risk Overview</h2>
            <p className="text-muted-foreground text-lg">
              Current risk landscape across different categories with priority distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Risk Categories */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Risk Categories</CardTitle>
                  <CardDescription>Distribution of identified risks by category and severity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {riskCategories.map((category, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{category.count} risks</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div className="h-full flex">
                              <div
                                className="bg-red-500"
                                style={{ width: `${(category.high / category.count) * 100}%` }}
                              />
                              <div
                                className="bg-orange-500"
                                style={{ width: `${(category.medium / category.count) * 100}%` }}
                              />
                              <div
                                className="bg-green-500"
                                style={{ width: `${(category.low / category.count) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            High: {category.high}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Medium: {category.medium}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Low: {category.low}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Risk Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">51</div>
                    <div className="text-sm text-muted-foreground">Total Active Risks</div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Priority</span>
                      <Badge variant="destructive">9</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Priority</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">26</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Priority</span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">16</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Risk Register Access</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Detailed risk register is available to authorized personnel only
                      </p>
                      <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">
                        <Lock className="mr-1 h-3 w-3" />
                        Request Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Recent Risk Activities</h2>
            <p className="text-muted-foreground text-lg">
              Latest risk management activities and updates across the organization.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRiskActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{activity.activity}</h4>
                        <Badge variant="outline">{activity.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold mb-4">Risk Management Resources</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Access additional risk management tools, templates, and guidance to support your risk management
                  activities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/documents/policies">
                      <FileText className="mr-2 h-4 w-4" />
                      Risk Policies
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contact">
                      <Users className="mr-2 h-4 w-4" />
                      Contact Risk Team
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/documents/procedures">
                      Risk Procedures
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
