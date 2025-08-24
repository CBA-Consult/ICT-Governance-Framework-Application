import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Server,
  Users,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  Download,
} from "lucide-react"
import Link from "next/link"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from "recharts"

// Sample performance data
const kpiData = [
  {
    title: "System Uptime",
    value: "99.8%",
    target: "99.5%",
    trend: "up",
    change: "+0.2%",
    status: "excellent",
    description: "Average uptime across all critical systems",
    icon: Server,
  },
  {
    title: "Mean Time to Resolution",
    value: "2.4 hrs",
    target: "4.0 hrs",
    trend: "down",
    change: "-0.8 hrs",
    status: "excellent",
    description: "Average time to resolve critical incidents",
    icon: Clock,
  },
  {
    title: "Project Budget Variance",
    value: "3.2%",
    target: "5.0%",
    trend: "up",
    change: "+1.1%",
    status: "good",
    description: "Variance from approved project budgets",
    icon: DollarSign,
  },
  {
    title: "User Satisfaction Score",
    value: "4.2/5",
    target: "4.0/5",
    trend: "up",
    change: "+0.3",
    status: "excellent",
    description: "Average user satisfaction with ICT services",
    icon: Users,
  },
  {
    title: "Security Incidents",
    value: "2",
    target: "< 5",
    trend: "down",
    change: "-3",
    status: "excellent",
    description: "Number of security incidents this month",
    icon: AlertCircle,
  },
  {
    title: "Change Success Rate",
    value: "94.5%",
    target: "90.0%",
    trend: "up",
    change: "+2.1%",
    status: "excellent",
    description: "Percentage of successful system changes",
    icon: CheckCircle,
  },
]

const uptimeData = [
  { month: "Jul", uptime: 99.2 },
  { month: "Aug", uptime: 99.5 },
  { month: "Sep", uptime: 99.1 },
  { month: "Oct", uptime: 99.7 },
  { month: "Nov", uptime: 99.8 },
  { month: "Dec", uptime: 99.6 },
  { month: "Jan", uptime: 99.8 },
]

const incidentData = [
  { month: "Jul", incidents: 8, resolved: 7 },
  { month: "Aug", incidents: 6, resolved: 6 },
  { month: "Sep", incidents: 12, resolved: 11 },
  { month: "Oct", incidents: 4, resolved: 4 },
  { month: "Nov", incidents: 3, resolved: 3 },
  { month: "Dec", incidents: 5, resolved: 5 },
  { month: "Jan", incidents: 2, resolved: 2 },
]

const budgetData = [
  { quarter: "Q1 2023", planned: 2500000, actual: 2450000 },
  { quarter: "Q2 2023", planned: 2800000, actual: 2920000 },
  { quarter: "Q3 2023", planned: 2600000, actual: 2680000 },
  { quarter: "Q4 2023", planned: 3200000, actual: 3150000 },
  { quarter: "Q1 2024", planned: 2700000, actual: 2788000 },
]

const reportingSchedule = [
  {
    report: "Executive Dashboard",
    frequency: "Weekly",
    audience: "C-Suite, Board of Directors",
    nextDelivery: "2024-01-29",
    format: "PowerBI Dashboard",
  },
  {
    report: "Operational Metrics",
    frequency: "Daily",
    audience: "IT Operations Team",
    nextDelivery: "2024-01-23",
    format: "Automated Email",
  },
  {
    report: "Monthly Performance Review",
    frequency: "Monthly",
    audience: "IT Steering Committee",
    nextDelivery: "2024-02-05",
    format: "Detailed Report",
  },
  {
    report: "Quarterly Business Review",
    frequency: "Quarterly",
    audience: "Executive Management",
    nextDelivery: "2024-04-15",
    format: "Presentation",
  },
]

const chartConfig = {
  uptime: {
    label: "Uptime %",
    color: "hsl(var(--chart-1))",
  },
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-2))",
  },
  planned: {
    label: "Planned Budget",
    color: "hsl(var(--chart-1))",
  },
  actual: {
    label: "Actual Spend",
    color: "hsl(var(--chart-2))",
  },
}

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <BarChart3 className="h-6 w-6 text-chart-2" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Performance Measurement & Reporting</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Monitor and track ICT performance against established KPIs to ensure alignment with business objectives and
            continuous improvement.
          </p>
        </div>

        {/* KPI Overview */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Key Performance Indicators</h2>
            <p className="text-muted-foreground text-lg">
              Real-time view of critical ICT performance metrics and their performance against established targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon
              const isPositiveTrend = kpi.trend === "up"
              const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown

              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="font-heading text-lg">{kpi.title}</CardTitle>
                      </div>
                      <Badge
                        className={
                          kpi.status === "excellent"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : kpi.status === "good"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                        }
                      >
                        {kpi.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                        <div className="flex items-center gap-1">
                          <TrendIcon className={`h-4 w-4 ${isPositiveTrend ? "text-green-600" : "text-red-600"}`} />
                          <span
                            className={`text-sm font-medium ${isPositiveTrend ? "text-green-600" : "text-red-600"}`}
                          >
                            {kpi.change}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: <span className="font-medium">{kpi.target}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{kpi.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Performance Charts */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Performance Trends</h2>
            <p className="text-muted-foreground text-lg">
              Historical performance data and trends across key operational metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Uptime Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">System Uptime Trend</CardTitle>
                <CardDescription>Monthly uptime percentage for critical systems</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <AreaChart data={uptimeData}>
                    <XAxis dataKey="month" />
                    <YAxis domain={[98.5, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="uptime"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Incident Management Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Incident Management</CardTitle>
                <CardDescription>Monthly incidents reported and resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={incidentData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="incidents" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="resolved" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Budget Performance Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Budget Performance</CardTitle>
                <CardDescription>Quarterly planned vs actual ICT spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={budgetData}>
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="planned" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="actual" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        {/* Reporting Schedule */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Reporting Schedule</h2>
            <p className="text-muted-foreground text-lg">
              Regular performance reports delivered to stakeholders across the organization.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportingSchedule.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="font-heading text-lg">{report.report}</CardTitle>
                    <Badge variant="outline">{report.frequency}</Badge>
                  </div>
                  <CardDescription>Delivered to: {report.audience}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Next delivery: {report.nextDelivery}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Format: {report.format}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto mt-3">
                      <Download className="mr-2 h-4 w-4" />
                      View Latest Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Performance Summary */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold mb-4">Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div className="text-3xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-muted-foreground">KPIs Meeting Target</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">99.8%</div>
                    <div className="text-sm text-muted-foreground">Average Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">4.2/5</div>
                    <div className="text-sm text-muted-foreground">User Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">3.2%</div>
                    <div className="text-sm text-muted-foreground">Budget Variance</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Overall ICT performance remains strong with most KPIs exceeding targets. Focus areas include budget
                  management and continued improvement in service delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/documents">
                      <FileText className="mr-2 h-4 w-4" />
                      Performance Policies
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contact">Contact Performance Team</Link>
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
