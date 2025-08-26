import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Target, TrendingUp, Users, AlertTriangle, BarChart3, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

const keyPillars = [
  {
    title: "Strategic Alignment",
    description: "Ensuring ICT investments align with business objectives and strategic goals.",
    icon: Target,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Value Delivery",
    description: "Maximizing the value derived from ICT investments and initiatives.",
    icon: TrendingUp,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Risk Management",
    description: "Identifying, assessing, and mitigating ICT-related risks effectively.",
    icon: AlertTriangle,
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "Resource Management",
    description: "Optimizing the allocation and utilization of ICT resources.",
    icon: Users,
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    title: "Performance Measurement",
    description: "Monitoring and measuring ICT performance against defined metrics.",
    icon: BarChart3,
    color: "bg-chart-2/10 text-chart-2",
  },
]

const quickLinks = [
  { title: "Policies & Standards", href: "/documents", description: "Access governance documentation" },
  { title: "Roles & Responsibilities", href: "/roles", description: "View RACI matrix and assignments" },
  { title: "Risk Management", href: "/risk-management", description: "Review risk framework and register" },
  { title: "Performance Dashboard", href: "/performance", description: "Monitor ICT KPIs and metrics" },
]

const recentUpdates = [
  { title: "Information Security Policy v2.1 Released", date: "2024-01-15", type: "Policy Update" },
  { title: "Q4 Risk Assessment Completed", date: "2024-01-10", type: "Risk Management" },
  { title: "New IT Steering Committee Members", date: "2024-01-05", type: "Governance Structure" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 text-foreground">ICT Governance Framework</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Guiding the strategic alignment of technology with business objectives to deliver value and manage risk
            across our organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="font-medium">
              <Link href="/structure">
                Explore Framework
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-medium bg-transparent">
              <Link href="/documents">View Documentation</Link>
            </Button>
          </div>
        </section>

        {/* Key Pillars */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-4">Core Governance Domains</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our framework is built on five fundamental pillars that ensure comprehensive ICT governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyPillars.map((pillar, index) => {
              const Icon = pillar.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${pillar.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-heading text-xl">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{pillar.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-4">Quick Access</h2>
            <p className="text-muted-foreground text-lg">
              Navigate to the most frequently accessed sections of our governance framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center justify-between">
                    {link.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="w-full justify-start p-0 h-auto">
                    <Link href={link.href} className="text-primary hover:text-primary/80">
                      Access Now →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Updates */}
        <section>
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-4">Recent Updates</h2>
            <p className="text-muted-foreground text-lg">
              Stay informed about the latest changes and announcements to our governance framework.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Latest Framework Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <h4 className="font-medium text-foreground">{update.title}</h4>
                      <p className="text-sm text-muted-foreground">{update.date}</p>
                    </div>
                    <Badge variant="secondary">{update.type}</Badge>
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
