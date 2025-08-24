import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, BookOpen } from "lucide-react"

const glossaryTerms = [
  {
    term: "API (Application Programming Interface)",
    definition:
      "A set of protocols, routines, and tools for building software applications that specifies how software components should interact.",
    category: "Technical",
    letter: "A",
  },
  {
    term: "Business Continuity",
    definition:
      "The capability of an organization to continue delivery of products or services at acceptable predefined levels following a disruptive incident.",
    category: "Risk Management",
    letter: "B",
  },
  {
    term: "COBIT (Control Objectives for Information and Related Technologies)",
    definition:
      "A framework for developing, implementing, monitoring and improving information technology governance and management practices.",
    category: "Framework",
    letter: "C",
  },
  {
    term: "Data Governance",
    definition:
      "The overall management of the availability, usability, integrity, and security of data employed in an organization.",
    category: "Data Management",
    letter: "D",
  },
  {
    term: "Enterprise Architecture",
    definition:
      "A conceptual blueprint that defines the structure and operation of an organization's technology infrastructure.",
    category: "Architecture",
    letter: "E",
  },
  {
    term: "GDPR (General Data Protection Regulation)",
    definition:
      "A regulation in EU law on data protection and privacy in the European Union and the European Economic Area.",
    category: "Compliance",
    letter: "G",
  },
  {
    term: "ICT (Information and Communication Technology)",
    definition:
      "An extended term for information technology which stresses the role of unified communications and the integration of telecommunications and computers.",
    category: "General",
    letter: "I",
  },
  {
    term: "ISO 27001",
    definition:
      "An international standard that specifies the requirements for establishing, implementing, maintaining and continually improving an information security management system.",
    category: "Standards",
    letter: "I",
  },
  {
    term: "KPI (Key Performance Indicator)",
    definition: "A measurable value that demonstrates how effectively a company is achieving key business objectives.",
    category: "Performance",
    letter: "K",
  },
  {
    term: "NIST (National Institute of Standards and Technology)",
    definition:
      "A U.S. federal agency that develops technology, metrics, and standards to drive innovation and economic competitiveness.",
    category: "Standards",
    letter: "N",
  },
  {
    term: "RACI Matrix",
    definition:
      "A responsibility assignment chart that clarifies roles and responsibilities in cross-functional or departmental projects and processes. RACI stands for Responsible, Accountable, Consulted, and Informed.",
    category: "Governance",
    letter: "R",
  },
  {
    term: "Risk Appetite",
    definition:
      "The amount and type of risk that an organization is willing to pursue or retain in order to achieve its objectives.",
    category: "Risk Management",
    letter: "R",
  },
  {
    term: "SLA (Service Level Agreement)",
    definition:
      "A contract between a service provider and a customer that specifies the level of service expected from the service provider.",
    category: "Service Management",
    letter: "S",
  },
  {
    term: "Stakeholder",
    definition:
      "Any individual, group, or organization that can affect or is affected by the achievement of an organization's objectives.",
    category: "Governance",
    letter: "S",
  },
  {
    term: "Third-Party Risk",
    definition:
      "The potential for losses related to an organization's reliance on third parties (vendors, suppliers, partners) to provide products or services.",
    category: "Risk Management",
    letter: "T",
  },
]

const categories = [
  "All Categories",
  "Technical",
  "Risk Management",
  "Framework",
  "Data Management",
  "Architecture",
  "Compliance",
  "General",
  "Standards",
  "Performance",
  "Governance",
  "Service Management",
]

const letters = [
  "All",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
]

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <BookOpen className="h-6 w-6 text-chart-3" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Glossary</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Comprehensive definitions of technical and governance-related terms used throughout the ICT Governance
            Framework.
          </p>
        </div>

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search terms..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase().replace(" ", "-")}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Letter" />
              </SelectTrigger>
              <SelectContent>
                {letters.map((letter) => (
                  <SelectItem key={letter} value={letter.toLowerCase()}>
                    {letter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Alphabet Navigation */}
        <section className="mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {letters.slice(1).map((letter) => (
                  <button
                    key={letter}
                    className="w-8 h-8 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Terms List */}
        <section className="mb-8">
          <div className="space-y-4">
            {glossaryTerms.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-heading text-xl mb-2">{item.term}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="secondary">{item.letter}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{item.definition}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Statistics */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold mb-6">Glossary Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-primary">{glossaryTerms.length}</div>
                    <div className="text-sm text-muted-foreground">Total Terms</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-chart-2">{categories.length - 1}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-chart-3">
                      {new Set(glossaryTerms.map((t) => t.letter)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Letters Covered</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-chart-4">
                      {Math.round(
                        glossaryTerms.reduce((acc, term) => acc + term.definition.split(" ").length, 0) /
                          glossaryTerms.length,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Words/Definition</div>
                  </div>
                </div>
                <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
                  Our glossary is continuously updated to include new terms and concepts relevant to ICT governance. If
                  you have suggestions for additional terms, please contact our governance team.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
