import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, HelpCircle } from "lucide-react"

const keyContacts = [
  {
    name: "Sarah Johnson",
    title: "Chief Information Officer",
    department: "Executive Leadership",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 123-4567",
    responsibilities: ["ICT Strategy", "Budget Oversight", "Executive Reporting"],
    availability: "Mon-Fri 9:00 AM - 5:00 PM",
  },
  {
    name: "Michael Chen",
    title: "Head of IT Governance",
    department: "IT Governance",
    email: "michael.chen@company.com",
    phone: "+1 (555) 123-4568",
    responsibilities: ["Policy Development", "Compliance Monitoring", "Risk Assessment"],
    availability: "Mon-Fri 8:00 AM - 6:00 PM",
  },
  {
    name: "Emma Thompson",
    title: "Data Protection Officer",
    department: "Information Security",
    email: "emma.thompson@company.com",
    phone: "+1 (555) 123-4569",
    responsibilities: ["Data Privacy", "GDPR Compliance", "Privacy Impact Assessments"],
    availability: "Mon-Fri 9:00 AM - 5:00 PM",
  },
  {
    name: "David Kim",
    title: "Chief Information Security Officer",
    department: "Information Security",
    email: "david.kim@company.com",
    phone: "+1 (555) 123-4570",
    responsibilities: ["Security Strategy", "Incident Response", "Security Architecture"],
    availability: "24/7 for security incidents",
  },
  {
    name: "Lisa Rodriguez",
    title: "IT Service Manager",
    department: "IT Operations",
    email: "lisa.rodriguez@company.com",
    phone: "+1 (555) 123-4571",
    responsibilities: ["Service Delivery", "User Support", "SLA Management"],
    availability: "Mon-Fri 7:00 AM - 7:00 PM",
  },
  {
    name: "James Wilson",
    title: "Enterprise Architect",
    department: "Architecture",
    email: "james.wilson@company.com",
    phone: "+1 (555) 123-4572",
    responsibilities: ["Technical Architecture", "Standards Development", "Technology Roadmap"],
    availability: "Mon-Fri 9:00 AM - 5:00 PM",
  },
]

const supportChannels = [
  {
    title: "IT Helpdesk",
    description: "General IT support and technical assistance",
    contact: "helpdesk@company.com",
    phone: "+1 (555) 123-HELP",
    hours: "24/7",
    sla: "4 hours response time",
    icon: HelpCircle,
  },
  {
    title: "Governance Support",
    description: "Questions about policies, procedures, and compliance",
    contact: "governance@company.com",
    phone: "+1 (555) 123-4580",
    hours: "Mon-Fri 8:00 AM - 6:00 PM",
    sla: "1 business day response",
    icon: MessageSquare,
  },
  {
    title: "Security Incidents",
    description: "Report security incidents and vulnerabilities",
    contact: "security@company.com",
    phone: "+1 (555) 123-SECU",
    hours: "24/7",
    sla: "Immediate response for critical issues",
    icon: Phone,
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Contact & Support</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Get in touch with our governance team for questions, support, or feedback about the ICT Governance
            Framework.
          </p>
        </div>

        {/* Support Channels */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Support Channels</h2>
            <p className="text-muted-foreground text-lg">
              Multiple ways to get help and support for ICT-related issues and governance questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="font-heading text-lg">{channel.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${channel.contact}`} className="text-primary hover:underline">
                        {channel.contact}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{channel.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{channel.hours}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      SLA: {channel.sla}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Key Contacts */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Key Contacts</h2>
            <p className="text-muted-foreground text-lg">
              Direct contact information for key governance personnel and subject matter experts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {keyContacts.map((contact, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="font-heading text-lg">{contact.name}</CardTitle>
                      <CardDescription className="text-base">{contact.title}</CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {contact.department}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.availability}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Responsibilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {contact.responsibilities.map((responsibility, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {responsibility}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feedback Form */}
        <section>
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-4">Feedback & Questions</h2>
            <p className="text-muted-foreground text-lg">
              Submit questions or feedback about the ICT Governance Framework to help us improve our processes and
              documentation.
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Form
              </CardTitle>
              <CardDescription>
                We value your input and will respond to your inquiry within 1-2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="Enter your department" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Inquiry Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy Question</SelectItem>
                      <SelectItem value="procedure">Procedure Clarification</SelectItem>
                      <SelectItem value="compliance">Compliance Issue</SelectItem>
                      <SelectItem value="feedback">General Feedback</SelectItem>
                      <SelectItem value="suggestion">Improvement Suggestion</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide details about your question or feedback..."
                    className="min-h-[120px]"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Office Information */}
        <section className="mt-16">
          <Card className="bg-muted/50">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold mb-4">Office Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">123 Business Ave, Suite 100</p>
                      <p className="text-sm text-muted-foreground">Corporate City, CC 12345</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">Monday - Friday</p>
                      <p className="text-sm text-muted-foreground">8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Main Office</p>
                      <p className="text-sm text-muted-foreground">+1 (555) 123-4500</p>
                      <p className="text-sm text-muted-foreground">reception@company.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
