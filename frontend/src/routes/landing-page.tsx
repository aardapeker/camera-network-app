import { Link, redirect } from "react-router"
import { useTranslation } from "react-i18next"
import type { Route } from "./+types/landing-page"
import { getAuthStatus } from "~/functions/get_auth_status"
import { isServicePortalHost, landingPath } from "~/lib/service-portal"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { ModeToggleSwitch } from "~/components/mode-toggle-switch"
import {
  Network,
  Map,
  Server,
  Shield,
  Users,
  FileDown,
  Eye,
  Cpu,
  CircleCheck,
  ChevronRight,
  Layers,
} from "lucide-react"

export async function clientLoader() {
  try {
    const isAuth = await getAuthStatus()
    if (isAuth.authenticated) {
      throw redirect(landingPath())
    }
    // The portal host is a tool, not a marketing site: go straight to sign-in.
    if (isServicePortalHost()) {
      throw redirect("/signin")
    }
    return { isAuthenticated: false }
  } catch (e) {
    if (e instanceof Response) throw e
    return { isAuthenticated: false }
  }
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "FieldDesk | Network Topology & Field Service Platform" },
    {
      name: "description",
      content:
        "Network topology management platform for warehouse and logistics IT departments.",
    },
  ]
}

const features = [
  { icon: Map, titleKey: "landing.featureMapsTitle", descriptionKey: "landing.featureMapsDescription" },
  { icon: Cpu, titleKey: "landing.featureDeviceTitle", descriptionKey: "landing.featureDeviceDescription" },
  { icon: Layers, titleKey: "landing.featureRackTitle", descriptionKey: "landing.featureRackDescription" },
  { icon: Users, titleKey: "landing.featureClientTitle", descriptionKey: "landing.featureClientDescription" },
  { icon: FileDown, titleKey: "landing.featurePdfTitle", descriptionKey: "landing.featurePdfDescription" },
  { icon: Shield, titleKey: "landing.featureSecurityTitle", descriptionKey: "landing.featureSecurityDescription" },
]

const howItWorks = [
  { step: "01", titleKey: "landing.howStep1Title", descriptionKey: "landing.howStep1Description" },
  { step: "02", titleKey: "landing.howStep2Title", descriptionKey: "landing.howStep2Description" },
  { step: "03", titleKey: "landing.howStep3Title", descriptionKey: "landing.howStep3Description" },
]

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated } = loaderData
  const { t } = useTranslation()

  const navItems = [
    { label: t("landing.navFeatures"), href: "#features" },
    { label: t("landing.navHowItWorks"), href: "#how-it-works" },
  ]

  const stats = [
    { value: t("landing.statYearsValue"), label: t("landing.statYearsLabel") },
    { value: t("landing.statClientsValue"), label: t("landing.statClientsLabel") },
    { value: t("landing.statTopologiesValue"), label: t("landing.statTopologiesLabel") },
    { value: t("landing.statSupportValue"), label: t("landing.statSupportLabel") },
  ]

  const platformPoints = [
    t("landing.platformPoint1"),
    t("landing.platformPoint2"),
    t("landing.platformPoint3"),
    t("landing.platformPoint4"),
    t("landing.platformPoint5"),
    t("landing.platformPoint6"),
    t("landing.platformPoint7"),
  ]

  const insideCards = [
    { icon: Map, label: t("landing.cardTopologyViewerLabel"), desc: t("landing.cardTopologyViewerDesc") },
    { icon: Server, label: t("landing.cardDeviceRegistryLabel"), desc: t("landing.cardDeviceRegistryDesc") },
    { icon: Layers, label: t("landing.cardRackViewLabel"), desc: t("landing.cardRackViewDesc") },
    { icon: Eye, label: t("landing.cardClientPortalLabel"), desc: t("landing.cardClientPortalDesc") },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="FieldDesk"
              className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
            />
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <ModeToggleSwitch />
            <Button asChild size="sm">
              <Link to={isAuthenticated ? "/home" : "/signin"}>
                {isAuthenticated ? t("landing.goToDashboard") : t("landing.signIn")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-background to-background" />
        <div className="absolute -top-32 -right-32 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container mx-auto px-4 py-28 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
              <Network className="h-3.5 w-3.5 text-primary" />
              {t("landing.badge")}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
              {t("landing.heroTitlePart1")}{" "}
              <span className="text-primary">{t("landing.heroTitlePart2")}</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.heroSubtitle")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="px-8">
                <Link to={isAuthenticated ? "/home" : "/signin"}>
                  {isAuthenticated ? t("landing.openDashboard") : t("landing.getStarted")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <a href="#features">{t("landing.seeFeatures")}</a>
              </Button>
            </div>
          </div>

          {/* Quick stat strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">
            {t("landing.featuresEyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {t("landing.featuresSubtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.titleKey}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{t(feature.titleKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t(feature.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── How it works ── */}
      <section id="how-it-works" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">
            {t("landing.howEyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.howTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {t("landing.howSubtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {howItWorks.map((item, i) => (
            <div key={item.step} className="relative">
              {/* Connector line between steps */}
              {i < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary font-bold text-lg mb-6 shrink-0">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(item.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── What's inside ── */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">
                {t("landing.platformEyebrow")}
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("landing.platformTitle")}
              </h2>
              <p className="mt-6 text-muted-foreground">
                {t("landing.platformDescription")}
              </p>
              <div className="mt-8 space-y-3">
                {platformPoints.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CircleCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual placeholder showing the "app" */}
            <div className="grid grid-cols-2 gap-4">
              {insideCards.map((item) => (
                <Card key={item.label} className="p-5">
                  <item.icon className="h-7 w-7 text-primary mb-3" />
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="FieldDesk" className="h-7 object-contain opacity-80" />
              </div>
              <p className="text-sm text-muted-foreground">
                FieldDesk
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("landing.footerTagline")}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">{t("landing.quickLinks")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: t("landing.navFeatures"), href: "#features" },
                  { label: t("landing.navHowItWorks"), href: "#how-it-works" },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FieldDesk</p>
            <ModeToggleSwitch />
          </div>
        </div>
      </footer>
    </div>
  )
}
